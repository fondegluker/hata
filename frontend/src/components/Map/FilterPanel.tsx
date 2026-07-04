import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Button,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess, Clear } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { propertiesApi } from '@/api';

interface FilterPanelProps {
  onFilterChange: (filters: Record<string, unknown>) => void;
  initialFilters?: Record<string, unknown>;
}

const FilterPanel = ({ onFilterChange, initialFilters = {} }: FilterPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState((initialFilters.search as string) || '');
  const [propertyType, setPropertyType] = useState<string[]>((initialFilters.property_type as string[]) || []);
  const [saleType, setSaleType] = useState<string[]>((initialFilters.sale_type as string[]) || []);
  const [region, setRegion] = useState<string[]>((initialFilters.region as string[]) || []);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    (initialFilters.min_price as number) || 0,
    (initialFilters.max_price as number) || 500000,
  ]);
  const [areaRange, setAreaRange] = useState<[number, number]>([
    (initialFilters.min_area as number) || 0,
    (initialFilters.max_area as number) || 1000,
  ]);
  const [rooms, setRooms] = useState<string[]>((initialFilters.rooms as string[]) || []);

  // Fetch filter options
  const { data: regions = [] } = useQuery('regions', propertiesApi.getRegions);
  const { data: propertyTypes = [] } = useQuery('propertyTypes', propertiesApi.getPropertyTypes);

  const handleApply = () => {
    const filters: Record<string, unknown> = {
      search: search || undefined,
      property_type: propertyType.length > 0 ? propertyType : undefined,
      sale_type: saleType.length > 0 ? saleType : undefined,
      region: region.length > 0 ? region : undefined,
      min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
      max_price: priceRange[1] < 500000 ? priceRange[1] : undefined,
      min_area: areaRange[0] > 0 ? areaRange[0] : undefined,
      max_area: areaRange[1] < 1000 ? areaRange[1] : undefined,
    };
    onFilterChange(filters);
  };

  const handleReset = () => {
    setSearch('');
    setPropertyType([]);
    setSaleType([]);
    setRegion([]);
    setPriceRange([0, 500000]);
    setAreaRange([0, 1000]);
    setRooms([]);
    onFilterChange({});
  };

  const activeFiltersCount = [
    search,
    propertyType.length,
    saleType.length,
    region.length,
    priceRange[0] > 0 || priceRange[1] < 500000,
    areaRange[0] > 0 || areaRange[1] < 1000,
  ].filter(Boolean).length;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Search bar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Поиск по названию, адресу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />

        <Button variant="contained" onClick={handleApply}>
          Найти
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="outlined" onClick={handleReset} startIcon={<Clear />}>
            Сбросить
          </Button>
        )}

        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Active filters chips */}
      {activeFiltersCount > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {propertyType.map((t) => (
            <Chip key={t} label={t} size="small" onDelete={() => setPropertyType(propertyType.filter((p) => p !== t))} />
          ))}
          {saleType.map((t) => (
            <Chip
              key={t}
              label={t === 'auction' ? 'Аукцион' : 'Прямая продажа'}
              size="small"
              onDelete={() => setSaleType(saleType.filter((s) => s !== t))}
            />
          ))}
          {region.map((r) => (
            <Chip key={r} label={r} size="small" onDelete={() => setRegion(region.filter((reg) => reg !== r))} />
          ))}
        </Box>
      )}

      {/* Expanded filters */}
      <Collapse in={expanded}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
          {/* Property type */}
          <FormControl size="small">
            <InputLabel>Тип недвижимости</InputLabel>
            <Select
              multiple
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as string[])}
              label="Тип недвижимости"
            >
              <MenuItem value="house">Дом</MenuItem>
              <MenuItem value="apartment">Квартира</MenuItem>
              <MenuItem value="commercial">Коммерческая</MenuItem>
              <MenuItem value="land">Земельный участок</MenuItem>
              <MenuItem value="other">Другое</MenuItem>
            </Select>
          </FormControl>

          {/* Sale type */}
          <FormControl size="small">
            <InputLabel>Тип продажи</InputLabel>
            <Select
              multiple
              value={saleType}
              onChange={(e) => setSaleType(e.target.value as string[])}
              label="Тип продажи"
            >
              <MenuItem value="auction">Аукцион</MenuItem>
              <MenuItem value="direct_sale">Прямая продажа</MenuItem>
            </Select>
          </FormControl>

          {/* Region */}
          <FormControl size="small">
            <InputLabel>Регион</InputLabel>
            <Select
              multiple
              value={region}
              onChange={(e) => setRegion(e.target.value as string[])}
              label="Регион"
            >
              {regions.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Price range */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Цена: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} BYN
            </Typography>
            <Slider
              value={priceRange}
              onChange={(_, value) => setPriceRange(value as [number, number])}
              min={0}
              max={500000}
              step={10000}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => v.toLocaleString()}
            />
          </Box>

          {/* Area range */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Площадь: {areaRange[0]} - {areaRange[1]} м²
            </Typography>
            <Slider
              value={areaRange}
              onChange={(_, value) => setAreaRange(value as [number, number])}
              min={0}
              max={1000}
              step={10}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default FilterPanel;
