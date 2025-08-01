import OpenAI from 'openai';

// API平台类型
export type ApiPlatform = 'openai' | 'azure';

// API配置接口
export interface ApiConfig {
    platform: ApiPlatform;
    apiKey: string;
    baseURL?: string;
    deploymentName?: string; // Azure部署名称
    apiVersion?: string; // Azure API版本
}

// 获取API配置
export function getApiConfig(): ApiConfig {
    const platform = (process.env.API_PLATFORM as ApiPlatform) || 'openai';
    
    if (platform === 'azure') {
        return {
            platform: 'azure',
            apiKey: process.env.AZURE_API_KEY || '',
            baseURL: process.env.AZURE_BASE_URL || '',
            deploymentName: process.env.AZURE_DEPLOYMENT_NAME || '',
            apiVersion: process.env.AZURE_API_VERSION || '2025-04-01-preview'
        };
    } else {
        return {
            platform: 'openai',
            apiKey: process.env.OPENAI_API_KEY || '',
            baseURL: process.env.OPENAI_API_BASE_URL
        };
    }
}

// 创建OpenAI客户端
export function createOpenAIClient(config: ApiConfig): OpenAI {
    if (config.platform === 'azure') {
        // Azure配置
        const baseURL = `${config.baseURL}/openai/deployments/${config.deploymentName}`;
        return new OpenAI({
            apiKey: config.apiKey,
            baseURL: baseURL,
            defaultQuery: { 'api-version': config.apiVersion }
        });
    } else {
        // OpenAI配置
        return new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL
        });
    }
} 