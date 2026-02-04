-- Enable Supabase Realtime on analytics tables
ALTER PUBLICATION supabase_realtime ADD TABLE rec_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE rec_results;
