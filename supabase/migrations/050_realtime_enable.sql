-- Enable Supabase Realtime publication for live token balance updates and tree care events
alter publication supabase_realtime add table public.token_events;
alter publication supabase_realtime add table public.cacao_trees;
