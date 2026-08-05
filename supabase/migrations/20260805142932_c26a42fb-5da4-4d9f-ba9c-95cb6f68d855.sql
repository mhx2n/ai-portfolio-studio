CREATE POLICY "users manage own media" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'portfolio-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'portfolio-media' AND (storage.foldername(name))[1] = auth.uid()::text);