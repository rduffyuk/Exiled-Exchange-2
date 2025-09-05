import { ipcMain, IpcMainInvokeEvent } from 'electron';
import axios from 'axios';

interface AIBridgeConfig {
  baseUrl: string;
  timeout: number;
  enabled: boolean;
}

interface PriceCheckRequest {
  itemText: string;
  league: string;
}

interface ChatRequest {
  message: string;
  context?: any;
}

class AIBridgeIPCHandler {
  private config: AIBridgeConfig;

  constructor(config: Partial<AIBridgeConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:3001',
      timeout: 15000,
      enabled: true,
      ...config
    };
    
    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    // Health check handler
    ipcMain.handle('ai-bridge:health-check', async (): Promise<boolean> => {
      if (!this.config.enabled) return false;

      try {
        const response = await axios.get(`${this.config.baseUrl}/health`, {
          timeout: 5000
        });
        return response.data.status === 'healthy';
      } catch (error) {
        console.warn('AI Bridge health check failed:', error);
        return false;
      }
    });

    // Enhanced price check handler
    ipcMain.handle('ai-bridge:price-check', async (
      event: IpcMainInvokeEvent,
      request: PriceCheckRequest
    ) => {
      if (!this.config.enabled) {
        throw new Error('AI Bridge is disabled');
      }

      try {
        const response = await axios.post(`${this.config.baseUrl}/api/price-check`, request, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout
        });

        if (response.status !== 200) {
          throw new Error(`AI Bridge request failed: ${response.status}`);
        }

        return response.data;
      } catch (error) {
        console.error('AI Bridge price check failed:', error);
        throw error;
      }
    });

    // Market analysis handler
    ipcMain.handle('ai-bridge:market-analysis', async (
      event: IpcMainInvokeEvent,
      league: string,
      currency: string = 'divine'
    ) => {
      try {
        const response = await axios.get(
          `${this.config.baseUrl}/api/market/${encodeURIComponent(league)}?currency=${encodeURIComponent(currency)}`,
          { timeout: this.config.timeout }
        );

        if (response.status !== 200) {
          throw new Error(`Market analysis failed: ${response.status}`);
        }

        return response.data;
      } catch (error) {
        console.error('AI Bridge market analysis failed:', error);
        throw error;
      }
    });

    // AI chat handler
    ipcMain.handle('ai-bridge:chat', async (
      event: IpcMainInvokeEvent,
      request: ChatRequest
    ) => {
      try {
        const payload = {
          message: request.message,
          context: {
            model: 'Multimodal Lite',
            ...request.context
          }
        };

        const response = await axios.post(`${this.config.baseUrl}/api/chat`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout
        });

        if (response.status !== 200) {
          throw new Error(`AI chat failed: ${response.status}`);
        }

        return response.data;
      } catch (error) {
        console.error('AI Bridge chat failed:', error);
        throw error;
      }
    });

    // Configuration handlers
    ipcMain.handle('ai-bridge:get-config', async (): Promise<AIBridgeConfig> => {
      return { ...this.config };
    });

    ipcMain.handle('ai-bridge:set-config', async (
      event: IpcMainInvokeEvent,
      newConfig: Partial<AIBridgeConfig>
    ): Promise<void> => {
      this.config = { ...this.config, ...newConfig };
    });

    // Enable/disable handler
    ipcMain.handle('ai-bridge:set-enabled', async (
      event: IpcMainInvokeEvent,
      enabled: boolean
    ): Promise<void> => {
      this.config.enabled = enabled;
    });

    console.log('AI Bridge IPC handlers registered');
  }

  public updateConfig(newConfig: Partial<AIBridgeConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public getConfig(): AIBridgeConfig {
    return { ...this.config };
  }
}

export { AIBridgeIPCHandler };
export type { AIBridgeConfig, PriceCheckRequest, ChatRequest };