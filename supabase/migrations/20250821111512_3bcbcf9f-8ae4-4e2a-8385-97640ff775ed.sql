-- Add floor column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN floor integer NOT NULL DEFAULT 1;