import type { Node } from '../types';

export function useNodeServices() {
  const generateImage = () => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const imageUrl = `https://picsum.photos/seed/${Date.now()}/300/200`;
        resolve(imageUrl);
      }, 1000);
    });
  };

  const sendHttpRequest = async (node: Node) => {
    if (!node.url) {
      throw new Error('URL is required');
    }

    const options: RequestInit = {
      method: node.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...node.headers
      }
    };

    if ((node.method === 'POST' || node.method === 'PUT') && node.body) {
      options.body = node.body;
    }

    const response = await fetch(node.url, options);
    const data = await response.text();

    // 处理长内容
    if (data.length > 1000) {
      return data.substring(0, 1000) + '... [内容过长，已截断]';
    }
    return data;
  };

  const executeJsCode = (node: Node, inputParams: any[]) => {
    if (!node.code) {
      throw new Error('Code is required');
    }

    try {
      let result;
      
      // 保持向后兼容：如果代码中使用了input参数
      if (node.code.includes('input') && !node.code.includes('param1') && !node.code.includes('params')) {
        // 使用旧的单参数形式
        const inputValue = inputParams.length > 0 ? inputParams[0] : (node.input || '');
        
        // Use Function constructor for safer execution
        const execute = new Function('input', node.code + '\nreturn process(input);');
        result = execute(inputValue);
      } else {
        // 使用新的多参数形式
        const paramNames = inputParams.map((_, index) => `param${index + 1}`);
        const processCall = inputParams.length > 0 ? `process(${paramNames.join(', ')})` : 'process()';
        
        // Use Function constructor for safer execution
        const execute = new Function(...paramNames, node.code + '\nreturn ' + processCall);
        result = execute(...inputParams);
      }
      
      let output = '';
      if (typeof result === 'object') {
        output = JSON.stringify(result, null, 2);
      } else {
        output = String(result);
      }
      
      // 检测并处理图片DataURL，避免直接显示长DataURL
      if (output.startsWith('data:image/')) {
        // 对于图片DataURL，只显示类型信息
        const match = output.match(/data:image\/(\w+);base64,/);
        if (match) {
          return `[图片: ${match[1]}格式]`;
        } else {
          return '[图片数据]';
        }
      } else if (output.length > 1000) {
        // 对于长文本，进行截断
        return output.substring(0, 1000) + '... [内容过长，已截断]';
      } else {
        return output;
      }
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const sendChatMessage = async (message: string, messages: Array<{role: string, content: string}>) => {
    const apiKey = 'sk-1acdc57096d942779a7c2331d26d7cb5';
    const baseUrl = 'https://api.deepseek.com';
    const model = 'deepseek-chat';

    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...messages,
        { role: 'user', content: message }
      ],
      stream: false
    };

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      throw error;
    }
  };

  const sendAIRequest = async (node: Node) => {
    if (!node.baseUrl || node.baseUrl.trim() === '' || !node.apiKey || node.apiKey.trim() === '' || !node.model || node.model.trim() === '' || !node.prompt || node.prompt.trim() === '') {
      throw new Error('Base URL, API Key, Model and Prompt are required');
    }

    const requestBody = {
      model: node.model,
      messages: [
        { role: 'user', content: node.prompt }
      ],
      stream: false
    };

    try {
      const response = await fetch(`${node.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${node.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
  };

  return {
    generateImage,
    sendHttpRequest,
    executeJsCode,
    sendChatMessage,
    sendAIRequest
  };
}
