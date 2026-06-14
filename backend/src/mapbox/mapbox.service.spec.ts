import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MapboxService } from './mapbox.service';

describe('MapboxService', () => {
  let service: MapboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapboxService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => 'test_token',
            get: (key: string, def: string) => def,
          },
        },
      ],
    }).compile();

    service = module.get<MapboxService>(MapboxService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('geocode should return null for empty result', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ features: [] }),
      } as Response),
    );

    const result = await service.geocode('nonexistent address');
    expect(result).toBeNull();
  });

  it('optimizeRoute should return null for < 2 waypoints', async () => {
    const result = await service.optimizeRoute([{ lat: 10, lng: 106 }]);
    expect(result).toBeNull();
  });
});
