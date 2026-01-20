-- Add position and size columns to rooms table for visual map layout
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS position_x integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_y integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS width integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS height integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS corridor_side text DEFAULT 'left' CHECK (corridor_side IN ('left', 'right', 'top', 'bottom'));

-- Add comment for documentation
COMMENT ON COLUMN public.rooms.position_x IS 'X position on the floor grid (0-based)';
COMMENT ON COLUMN public.rooms.position_y IS 'Y position on the floor grid (0-based)';
COMMENT ON COLUMN public.rooms.width IS 'Width of room in grid units';
COMMENT ON COLUMN public.rooms.height IS 'Height of room in grid units';
COMMENT ON COLUMN public.rooms.corridor_side IS 'Which side of the corridor the room is on';