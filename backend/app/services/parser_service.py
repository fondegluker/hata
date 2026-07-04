"""Parser service for scraping eri2.nca.by."""

import asyncio
import random
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin, urlparse

import aiohttp
from playwright.async_api import async_playwright, Page, Browser
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.property import Property, PropertyPhoto
from app.schemas.parser import ParserProgress, ParserStatusEnum

settings = get_settings()


class ParserService:
    """Service for parsing property data from eri2.nca.by."""

    def __init__(self):
        self.base_url = settings.parser_base_url
        self.delay_min = settings.parser_delay_min
        self.delay_max = settings.parser_delay_max
        self.timeout = settings.parser_timeout
        self.user_agents = settings.parser_user_agents
        self.browser: Browser | None = None
        self._stop_requested = False
        self._is_paused = False

    async def run(
        self,
        request: Any,
        db: AsyncSession,
        progress: ParserProgress,
        logs: list[dict],
    ) -> None:
        """Run the parser."""
        try:
            await self._log(logs, "info", "Parser starting...")

            async with async_playwright() as p:
                # Launch browser with stealth settings
                self.browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--disable-blink-features=AutomationControlled",
                        "--disable-features=IsolateOrigins,site-per-process",
                        "--disable-site-isolation-trials",
                        "--disable-web-security",
                        "--disable-features=BlockInsecurePrivateNetworkRequests",
                    ],
                )

                context = await self.browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent=random.choice(self.user_agents),
                    locale="ru-BY",
                    timezone_id="Europe/Minsk",
                )

                # Add stealth scripts
                await context.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    });
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5]
                    });
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['ru', 'ru-BY', 'en']
                    });
                    window.chrome = {
                        runtime: {}
                    };
                """)

                page = await context.new_page()

                # Navigate to the site and discover structure
                await self._log(logs, "info", f"Navigating to {self.base_url}")
                await self._navigate_with_retry(page, self.base_url, logs)

                # Wait for page to load
                await asyncio.sleep(random.uniform(2, 4))

                # Discover and parse property listings
                await self._discover_and_parse(page, db, progress, logs, request)

                await context.close()
                await self.browser.close()

            progress.status = ParserStatusEnum.COMPLETED
            await self._log(
                logs,
                "info",
                f"Parser completed. Added: {progress.items_added}, "
                f"Updated: {progress.items_updated}, Skipped: {progress.items_skipped}",
            )

        except Exception as e:
            progress.status = ParserStatusEnum.ERROR
            await self._log(logs, "error", f"Parser error: {str(e)}", {"error": str(e)})

        finally:
            if self.browser:
                await self.browser.close()

    async def _navigate_with_retry(
        self, page: Page, url: str, logs: list[dict], max_retries: int = 3
    ) -> bool:
        """Navigate to URL with retry logic."""
        for attempt in range(max_retries):
            try:
                await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=self.timeout,
                )
                return True
            except Exception as e:
                await self._log(
                    logs, "warning", f"Navigation attempt {attempt + 1} failed: {str(e)}"
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(random.uniform(5, 10))

        return False

    async def _discover_and_parse(
        self,
        page: Page,
        db: AsyncSession,
        progress: ParserProgress,
        logs: list[dict],
        request: Any,
    ) -> None:
        """Discover site structure and parse properties."""
        # Wait for the main content to load
        await self._wait_for_content(page)

        # Try to find property listings on the page
        # This will need to be adjusted based on actual site structure
        property_links = await self._get_property_links(page, logs)
        progress.total_pages = len(property_links)

        await self._log(
            logs, "info", f"Found {len(property_links)} property links"
        )

        for i, link in enumerate(property_links):
            # Check for stop/pause
            while self._is_paused:
                await asyncio.sleep(1)

            if self._stop_requested:
                await self._log(logs, "info", "Parser stopped by user")
                break

            progress.current_page = i + 1
            progress.current_item = link

            try:
                # Parse property page
                property_data = await self._parse_property_page(page, link, logs)

                if property_data:
                    await self._save_property(db, property_data, progress, logs)

                # Random delay between requests
                await self._random_delay()

            except Exception as e:
                progress.items_failed += 1
                await self._log(logs, "error", f"Failed to parse {link}: {str(e)}")

            # Incremental save every 10 items
            if progress.items_processed % 10 == 0:
                await db.commit()

    async def _wait_for_content(self, page: Page) -> None:
        """Wait for main content to load."""
        # Wait for common content indicators
        selectors = [
            "table",
            ".property-list",
            ".object-list",
            "[class*='property']",
            "[class*='object']",
            "a[href*='object']",
            "a[href*='property']",
        ]

        for selector in selectors:
            try:
                await page.wait_for_selector(selector, timeout=5000)
                break
            except Exception:
                continue

    async def _get_property_links(self, page: Page, logs: list[dict]) -> list[str]:
        """Extract property links from listing page."""
        links = []

        # Common patterns for property links
        patterns = [
            "a[href*='object']",
            "a[href*='property']",
            "a[href*='lot']",
            "a[href*='auction']",
            ".property-link a",
            ".object-link a",
            "table tbody tr td a",
        ]

        for pattern in patterns:
            try:
                elements = await page.query_selector_all(pattern)
                for element in elements:
                    href = await element.get_attribute("href")
                    if href:
                        full_url = urljoin(self.base_url, href)
                        if full_url not in links:
                            links.append(full_url)
            except Exception:
                continue

        # If no links found, try to get all links and filter
        if not links:
            await self._log(logs, "warning", "No links found with standard patterns, trying all links")
            all_links = await page.query_selector_all("a")
            for element in all_links[:100]:  # Limit to first 100
                href = await element.get_attribute("href")
                if href and ("object" in href.lower() or "property" in href.lower() or "lot" in href.lower()):
                    full_url = urljoin(self.base_url, href)
                    if full_url not in links:
                        links.append(full_url)

        return links

    async def _parse_property_page(
        self, page: Page, url: str, logs: list[dict]
    ) -> dict | None:
        """Parse individual property page."""
        try:
            await self._navigate_with_retry(page, url, logs)
            await asyncio.sleep(random.uniform(1, 2))

            # Get page content
            content = await page.content()

            # Extract property data using multiple strategies
            property_data = {
                "external_id": self._extract_id_from_url(url),
                "source_url": url,
                "parsed_at": datetime.now(timezone.utc),
            }

            # Try to extract data from tables (common in property listings)
            tables = await page.query_selector_all("table")
            for table in tables:
                rows = await table.query_selector_all("tr")
                for row in rows:
                    cells = await row.query_selector_all("td, th")
                    if len(cells) >= 2:
                        label = await cells[0].inner_text()
                        value = await cells[1].inner_text()

                        # Map common fields
                        label_lower = label.lower().strip()
                        property_data.update(
                            self._map_field(label_lower, value.strip())
                        )

            # Try to extract title
            title_selectors = ["h1", ".title", ".property-title", ".object-title"]
            for selector in title_selectors:
                title_elem = await page.query_selector(selector)
                if title_elem:
                    title = await title_elem.inner_text()
                    if title:
                        property_data["title"] = title.strip()
                        break

            # Default title if not found
            if "title" not in property_data or not property_data["title"]:
                property_data["title"] = f"Property {property_data['external_id']}"

            # Extract description
            desc_selectors = [
                ".description",
                ".property-description",
                "#description",
                "[class*='description']",
            ]
            for selector in desc_selectors:
                desc_elem = await page.query_selector(selector)
                if desc_elem:
                    property_data["description"] = await desc_elem.inner_text()
                    break

            # Extract photos
            photo_urls = await self._extract_photos(page)
            property_data["photos"] = photo_urls

            # Determine property type and sale type
            property_data["property_type"] = self._detect_property_type(content, property_data)
            property_data["sale_type"] = self._detect_sale_type(content, url)

            return property_data

        except Exception as e:
            await self._log(logs, "error", f"Error parsing {url}: {str(e)}")
            return None

    def _extract_id_from_url(self, url: str) -> str:
        """Extract property ID from URL."""
        # Try to find numeric ID in URL
        match = re.search(r"/(\d+)", url)
        if match:
            return match.group(1)

        # Try to find UUID
        match = re.search(r"/([a-f0-9-]{36})", url)
        if match:
            return match.group(1)

        # Use URL hash as fallback
        return str(hash(url) % 10000000)

    def _map_field(self, label: str, value: str) -> dict:
        """Map label-value pair to property fields."""
        mappings = {
            "адрес": "address",
            "район": "district",
            "город": "city",
            "область": "region",
            "площадь": "total_area",
            "общая площадь": "total_area",
            "жилая площадь": "living_area",
            "площадь участка": "land_area",
            "комнат": "rooms",
            "количество комнат": "rooms",
            "этаж": "floor",
            "этажей": "floors",
            "год постройки": "year_built",
            "цена": "price",
            "начальная цена": "starting_price",
            "текущая ставка": "current_bid",
            "продавец": "seller_name",
            "телефон": "seller_phone",
            "статус": "status",
        }

        result = {}

        for key, field in mappings.items():
            if key in label:
                # Clean value
                clean_value = value.replace("\n", " ").strip()

                # Try to extract numeric values
                if field in ["price", "starting_price", "current_bid"]:
                    # Remove currency symbols and extract number
                    numbers = re.findall(r"[\d\s]+\.?\d*", clean_value)
                    if numbers:
                        clean_value = numbers[0].replace(" ", "").replace(",", ".")
                        try:
                            result[field] = float(clean_value)
                        except ValueError:
                            pass

                elif field in ["total_area", "living_area", "land_area"]:
                    numbers = re.findall(r"[\d.]+", clean_value)
                    if numbers:
                        try:
                            result[field] = float(numbers[0])
                        except ValueError:
                            pass

                elif field in ["rooms", "floor", "floors", "year_built"]:
                    numbers = re.findall(r"\d+", clean_value)
                    if numbers:
                        result[field] = int(numbers[0])

                else:
                    result[field] = clean_value

                break

        return result

    async def _extract_photos(self, page: Page) -> list[str]:
        """Extract photo URLs from property page."""
        photos = []

        # Common photo selectors
        selectors = [
            ".gallery img",
            ".photos img",
            ".property-photos img",
            ".slider img",
            "img[src*='photo']",
            "img[src*='image']",
            "a[href*='photo'] img",
            "a[data-fancybox] img",
        ]

        for selector in selectors:
            try:
                img_elements = await page.query_selector_all(selector)
                for img in img_elements:
                    # Try src attribute
                    src = await img.get_attribute("src")
                    if src and src.startswith("http"):
                        if src not in photos:
                            photos.append(src)

                    # Try data-src for lazy-loaded images
                    data_src = await img.get_attribute("data-src")
                    if data_src and data_src.startswith("http"):
                        if data_src not in photos:
                            photos.append(data_src)
            except Exception:
                continue

        return photos

    def _detect_property_type(self, content: str, data: dict) -> str:
        """Detect property type from content."""
        content_lower = content.lower()

        if any(kw in content_lower for kw in ["дом", "жилой дом", "коттедж"]):
            return "house"
        elif any(kw in content_lower for kw in ["квартир", "апартамен"]):
            return "apartment"
        elif any(kw in content_lower for kw in ["коммерческ", "офис", "склад", "торгов"]):
            return "commercial"
        elif any(kw in content_lower for kw in ["земельн", "участок"]):
            return "land"
        else:
            return "other"

    def _detect_sale_type(self, content: str, url: str) -> str:
        """Detect sale type from content and URL."""
        content_lower = content.lower()
        url_lower = url.lower()

        if any(kw in content_lower for kw in ["аукцион", "торги"]) or "auction" in url_lower:
            return "auction"
        else:
            return "direct_sale"

    async def _save_property(
        self,
        db: AsyncSession,
        property_data: dict,
        progress: ParserProgress,
        logs: list[dict],
    ) -> None:
        """Save or update property in database."""
        external_id = property_data.get("external_id")
        if not external_id:
            progress.items_skipped += 1
            return

        # Check if property exists
        result = await db.execute(
            select(Property).where(Property.external_id == external_id)
        )
        existing = result.scalar_one_or_none()

        # Extract photos
        photos = property_data.pop("photos", [])

        if existing:
            # Update existing property
            for key, value in property_data.items():
                if key != "external_id" and value is not None:
                    setattr(existing, key, value)
            progress.items_updated += 1
            prop = existing

        else:
            # Create new property
            prop = Property(**property_data)
            db.add(prop)
            progress.items_added += 1

        # Add photos
        for i, photo_url in enumerate(photos[:20]):  # Limit to 20 photos
            photo = PropertyPhoto(
                property=prop,
                original_url=photo_url,
                order=i,
                is_main=(i == 0),
            )
            db.add(photo)
            progress.photos_downloaded += 1

        progress.items_processed += 1

    async def _random_delay(self) -> None:
        """Random delay between requests."""
        delay = random.uniform(self.delay_min, self.delay_max)
        await asyncio.sleep(delay)

    async def _log(
        self, logs: list[dict], level: str, message: str, details: dict | None = None
    ) -> None:
        """Add log entry."""
        logs.append({
            "timestamp": datetime.now(timezone.utc),
            "level": level,
            "message": message,
            "details": details,
        })

    def stop(self) -> None:
        """Request parser to stop."""
        self._stop_requested = True

    def pause(self) -> None:
        """Pause parser."""
        self._is_paused = True

    def resume(self) -> None:
        """Resume parser."""
        self._is_paused = False
