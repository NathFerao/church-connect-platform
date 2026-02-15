declare global {
  namespace Express {
    interface Request {
      user?: any;
      churchId?: string;
    }
  }
}

export {};