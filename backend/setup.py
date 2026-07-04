from setuptools import setup, find_packages

setup(
    name="hata-backend",
    version="1.0.0",
    description="Hata - Real Estate Parser and Visualization System",
    python_requires=">=3.11",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "fastapi>=0.109.0",
        "uvicorn[standard]>=0.27.0",
        "sqlalchemy>=2.0.25",
        "asyncpg>=0.29.0",
        "alembic>=1.13.1",
        "pydantic>=2.5.3",
        "pydantic-settings>=2.1.0",
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        "python-multipart>=0.0.6",
        "playwright>=1.41.0",
        "aiohttp>=3.9.1",
        "aiofiles>=23.2.1",
        "openpyxl>=3.1.2",
        "reportlab>=4.0.8",
        "Pillow>=10.2.0",
        "httpx>=0.26.0",
        "websockets>=12.0",
        "python-dateutil>=2.8.2",
        "email-validator>=2.1.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.4",
            "pytest-asyncio>=0.23.3",
            "httpx>=0.26.0",
            "black>=24.1.1",
            "ruff>=0.1.14",
            "mypy>=1.8.0",
        ]
    },
)
