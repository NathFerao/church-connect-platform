import { Request } from 'express';

export const getParam = (req: Request, name: string): string => {
  const raw = req.params[name];
  if (Array.isArray(raw)) return raw[0] ?? '';
  return raw ?? '';
};