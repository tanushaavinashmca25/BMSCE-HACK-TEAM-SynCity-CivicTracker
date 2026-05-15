from typing import Optional, Tuple
from ..db.supabase import supabase
from ..schemas import GeoLocation, DeduplicationResult

class GeoService:
    @staticmethod
    async def check_deduplication(
        location: GeoLocation, 
        category: str, 
        radius_meters: float = 10.0
    ) -> DeduplicationResult:
        """
        Calls the Supabase RPC 'check_nearby_reports' to find duplicates.
        """
        try:
            response = supabase.rpc(
                'check_nearby_reports', 
                {
                    'lat': location.latitude,
                    'lng': location.longitude,
                    'radius_meters': radius_meters,
                    'category_text': category
                }
            ).execute()
            
            if response.data and len(response.data) > 0:
                duplicate = response.data[0]
                return DeduplicationResult(
                    is_duplicate=True,
                    existing_report_id=duplicate['id'],
                    distance_meters=duplicate['distance']
                )
            
            return DeduplicationResult(is_duplicate=False)
        except Exception as e:
            # Log error
            print(f"Error checking deduplication: {e}")
            return DeduplicationResult(is_duplicate=False)

    @staticmethod
    def get_point_sql(lat: float, lng: float) -> str:
        """Helper to create PostGIS point SQL string"""
        return f"ST_SetSRID(ST_Point({lng}, {lat}), 4326)::geography"
