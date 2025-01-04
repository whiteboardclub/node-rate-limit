// will come back on this on setting up config
export interface RateLimiterConfig {
    strategy: 'token-bucket' | 'sliding-window' | 'fixed-window';  
    limit: number;       
    duration: number;    
  }
  
  export const rateLimiterConfig: RateLimiterConfig = {
    strategy: 'token-bucket', 
    limit: 100,
    duration: 60000, 
  };
  