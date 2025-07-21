# FastGPT 插件安全实践指南

本文档提供了 FastGPT 插件开发中安全相关的最佳实践和示例代码。

## 安全原则

### 1. 最小权限原则
- 只请求必要的权限和访问
- 限制API密钥的作用域
- 使用临时凭证而非永久密钥

### 2. 深度防御
- 多层安全验证
- 输入验证和输出过滤
- 错误处理不泄露敏感信息

### 3. 安全默认
- 默认拒绝访问
- 安全的默认配置
- 明确的安全边界

## 输入验证和清理

### 1. 严格的输入验证

```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// 安全的输入验证模式
const SecureInputSchema = z.object({
  // 字符串长度限制
  query: z.string()
    .min(1, '查询不能为空')
    .max(1000, '查询长度不能超过1000字符')
    .regex(/^[a-zA-Z0-9\s\u4e00-\u9fa5.,!?-]+$/, '包含非法字符'),
  
  // 数值范围限制
  limit: z.number()
    .int('必须是整数')
    .min(1, '最小值为1')
    .max(100, '最大值为100'),
  
  // URL验证
  url: z.string()
    .url('无效的URL格式')
    .refine(url => {
      const parsed = new URL(url);
      // 只允许HTTPS协议
      return parsed.protocol === 'https:';
    }, 'URL必须使用HTTPS协议')
    .refine(url => {
      const parsed = new URL(url);
      // 禁止内网地址
      const hostname = parsed.hostname;
      return !isPrivateIP(hostname);
    }, '不允许访问内网地址'),
  
  // 邮箱验证
  email: z.string()
    .email('无效的邮箱格式')
    .max(254, '邮箱长度过长'),
  
  // 文件路径验证
  filePath: z.string()
    .refine(path => {
      // 防止路径遍历攻击
      return !path.includes('..') && !path.startsWith('/');
    }, '无效的文件路径')
});

// 检查是否为私有IP地址
function isPrivateIP(hostname: string): boolean {
  const privateRanges = [
    /^127\./, // 127.0.0.0/8
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^169\.254\./, // 169.254.0.0/16 (链路本地)
    /^::1$/, // IPv6 localhost
    /^fc00:/, // IPv6 私有地址
  ];
  
  return privateRanges.some(range => range.test(hostname));
}

// HTML内容清理
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input']
  });
}

// SQL注入防护
export function sanitizeSqlInput(input: string): string {
  // 移除或转义危险字符
  return input
    .replace(/'/g, "''") // 转义单引号
    .replace(/;/g, '') // 移除分号
    .replace(/--/g, '') // 移除SQL注释
    .replace(/\/\*/g, '') // 移除多行注释开始
    .replace(/\*\//g, ''); // 移除多行注释结束
}
```

### 2. 命令注入防护

```typescript
import { spawn } from 'child_process';
import { promisify } from 'util';

// 安全的命令执行
export class SecureCommandExecutor {
  private allowedCommands = new Set([
    'git', 'npm', 'node', 'python3', 'curl'
  ]);
  
  private allowedOptions = new Map([
    ['git', new Set(['status', 'log', 'diff', 'show'])],
    ['npm', new Set(['list', 'info', 'view'])],
    ['curl', new Set(['-s', '-L', '--max-time'])]
  ]);
  
  async executeCommand(
    command: string, 
    args: string[], 
    options: { timeout?: number; cwd?: string } = {}
  ): Promise<{ stdout: string; stderr: string }> {
    // 验证命令是否在允许列表中
    if (!this.allowedCommands.has(command)) {
      throw new Error(`命令 "${command}" 不在允许列表中`);
    }
    
    // 验证参数
    const allowedArgs = this.allowedOptions.get(command);
    if (allowedArgs) {
      for (const arg of args) {
        if (arg.startsWith('-') && !allowedArgs.has(arg)) {
          throw new Error(`参数 "${arg}" 不被允许`);
        }
      }
    }
    
    // 清理参数，防止注入
    const cleanArgs = args.map(arg => this.sanitizeArgument(arg));
    
    return new Promise((resolve, reject) => {
      const child = spawn(command, cleanArgs, {
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false // 重要：不使用shell
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      // 设置超时
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('命令执行超时'));
      }, options.timeout || 30000);
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`命令执行失败，退出码: ${code}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
  
  private sanitizeArgument(arg: string): string {
    // 移除危险字符
    return arg
      .replace(/[;&|`$(){}[\]]/g, '') // 移除shell特殊字符
      .replace(/\.\./g, '') // 防止路径遍历
      .trim();
  }
}
```

## 密钥和凭证管理

### 1. 安全的密钥存储

```typescript
import crypto from 'crypto';

// 密钥管理器
export class SecureKeyManager {
  private static instance: SecureKeyManager;
  private keys = new Map<string, string>();
  private encryptionKey: Buffer;
  
  private constructor() {
    // 从环境变量获取主密钥
    const masterKey = process.env.MASTER_ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('未设置主加密密钥');
    }
    this.encryptionKey = crypto.scryptSync(masterKey, 'salt', 32);
  }
  
  static getInstance(): SecureKeyManager {
    if (!SecureKeyManager.instance) {
      SecureKeyManager.instance = new SecureKeyManager();
    }
    return SecureKeyManager.instance;
  }
  
  // 加密存储密钥
  storeKey(keyId: string, key: string): void {
    const encrypted = this.encrypt(key);
    this.keys.set(keyId, encrypted);
  }
  
  // 获取解密后的密钥
  getKey(keyId: string): string | null {
    const encrypted = this.keys.get(keyId);
    if (!encrypted) return null;
    
    try {
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('密钥解密失败:', error);
      return null;
    }
  }
  
  // 删除密钥
  deleteKey(keyId: string): void {
    this.keys.delete(keyId);
  }
  
  // 检查密钥是否存在
  hasKey(keyId: string): boolean {
    return this.keys.has(keyId);
  }
  
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(Buffer.from('fastgpt-plugin'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
  
  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('无效的加密数据格式');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    decipher.setAAD(Buffer.from('fastgpt-plugin'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// API密钥验证器
export class ApiKeyValidator {
  private static readonly KEY_PATTERNS = {
    openai: /^sk-[a-zA-Z0-9]{48}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{95}$/,
    google: /^[a-zA-Z0-9-_]{39}$/,
    azure: /^[a-f0-9]{32}$/
  };
  
  static validateKey(provider: string, key: string): boolean {
    const pattern = this.KEY_PATTERNS[provider as keyof typeof this.KEY_PATTERNS];
    if (!pattern) {
      throw new Error(`不支持的提供商: ${provider}`);
    }
    
    return pattern.test(key);
  }
  
  static maskKey(key: string): string {
    if (key.length <= 8) return '***';
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
  }
}
```

### 2. 安全的HTTP请求

```typescript
import https from 'https';
import { URL } from 'url';

// 安全的HTTP客户端
export class SecureHttpClient {
  private agent: https.Agent;
  
  constructor() {
    this.agent = new https.Agent({
      // 启用证书验证
      rejectUnauthorized: true,
      // 设置超时
      timeout: 30000,
      // 限制连接数
      maxSockets: 10,
      // 启用Keep-Alive
      keepAlive: true
    });
  }
  
  async request(
    url: string, 
    options: RequestInit & { 
      timeout?: number;
      maxRedirects?: number;
    } = {}
  ): Promise<Response> {
    // URL安全检查
    this.validateUrl(url);
    
    // 设置安全头部
    const secureHeaders = {
      'User-Agent': 'FastGPT-Plugin/1.0',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      ...options.headers
    };
    
    // 移除敏感头部信息
    delete secureHeaders['Authorization'];
    if (options.headers?.['Authorization']) {
      secureHeaders['Authorization'] = options.headers['Authorization'];
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout || 30000);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: secureHeaders,
        signal: controller.signal,
        // 限制重定向次数
        redirect: options.maxRedirects === 0 ? 'manual' : 'follow'
      });
      
      // 检查响应大小
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB限制
        throw new Error('响应内容过大');
      }
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  private validateUrl(url: string): void {
    let parsed: URL;
    
    try {
      parsed = new URL(url);
    } catch (error) {
      throw new Error('无效的URL格式');
    }
    
    // 只允许HTTPS协议
    if (parsed.protocol !== 'https:') {
      throw new Error('只允许HTTPS协议');
    }
    
    // 检查主机名
    if (isPrivateIP(parsed.hostname)) {
      throw new Error('不允许访问内网地址');
    }
    
    // 检查端口
    const port = parsed.port ? parseInt(parsed.port) : 443;
    if (port < 80 || port > 65535) {
      throw new Error('无效的端口号');
    }
    
    // 禁止某些危险的主机
    const dangerousHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1'
    ];
    
    if (dangerousHosts.includes(parsed.hostname.toLowerCase())) {
      throw new Error('禁止访问的主机地址');
    }
  }
}
```

## 数据保护

### 1. 敏感数据处理

```typescript
// 敏感数据清理器
export class SensitiveDataSanitizer {
  private static readonly SENSITIVE_PATTERNS = [
    // 信用卡号
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    // 身份证号
    /\b\d{17}[\dXx]\b/g,
    // 手机号
    /\b1[3-9]\d{9}\b/g,
    // 邮箱
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // API密钥模式
    /\b[Aa]pi[_-]?[Kk]ey\s*[:=]\s*['"]?([a-zA-Z0-9-_]{20,})['"]?/g,
    // 密码模式
    /\b[Pp]assword\s*[:=]\s*['"]?([^\s'"]{6,})['"]?/g
  ];
  
  static sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForLogging(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = this.maskValue(value);
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }
  
  private static sanitizeString(str: string): string {
    let sanitized = str;
    
    for (const pattern of this.SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, (match) => {
        return this.maskValue(match);
      });
    }
    
    return sanitized;
  }
  
  private static isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'passwd', 'pwd',
      'secret', 'token', 'key',
      'apikey', 'api_key',
      'authorization', 'auth',
      'credential', 'cred'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
  }
  
  private static maskValue(value: any): string {
    const str = String(value);
    if (str.length <= 4) return '***';
    return str.substring(0, 2) + '***' + str.substring(str.length - 2);
  }
}

// 数据加密工具
export class DataEncryption {
  static hashPassword(password: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512');
    return actualSalt + ':' + hash.toString('hex');
  }
  
  static verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  }
  
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  static hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
```

### 2. 安全的文件操作

```typescript
import fs from 'fs/promises';
import path from 'path';

// 安全的文件操作器
export class SecureFileOperator {
  private allowedExtensions = new Set([
    '.txt', '.json', '.csv', '.md', '.log'
  ]);
  
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private basePath: string;
  
  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }
  
  async readFile(filePath: string): Promise<string> {
    const safePath = this.validatePath(filePath);
    
    // 检查文件大小
    const stats = await fs.stat(safePath);
    if (stats.size > this.maxFileSize) {
      throw new Error('文件过大');
    }
    
    return fs.readFile(safePath, 'utf-8');
  }
  
  async writeFile(filePath: string, content: string): Promise<void> {
    const safePath = this.validatePath(filePath);
    
    // 检查内容大小
    if (Buffer.byteLength(content, 'utf-8') > this.maxFileSize) {
      throw new Error('内容过大');
    }
    
    // 确保目录存在
    await fs.mkdir(path.dirname(safePath), { recursive: true });
    
    // 写入文件
    await fs.writeFile(safePath, content, 'utf-8');
  }
  
  async deleteFile(filePath: string): Promise<void> {
    const safePath = this.validatePath(filePath);
    await fs.unlink(safePath);
  }
  
  async listFiles(dirPath: string = ''): Promise<string[]> {
    const safePath = this.validatePath(dirPath);
    const entries = await fs.readdir(safePath, { withFileTypes: true });
    
    return entries
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
      .filter(name => this.isAllowedFile(name));
  }
  
  private validatePath(filePath: string): string {
    // 规范化路径
    const normalizedPath = path.normalize(filePath);
    
    // 防止路径遍历攻击
    if (normalizedPath.includes('..')) {
      throw new Error('路径包含非法字符');
    }
    
    // 构建完整路径
    const fullPath = path.resolve(this.basePath, normalizedPath);
    
    // 确保路径在基础目录内
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error('路径超出允许范围');
    }
    
    return fullPath;
  }
  
  private isAllowedFile(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    return this.allowedExtensions.has(ext);
  }
}
```

## 安全审计和日志

### 1. 安全事件记录

```typescript
// 安全事件记录器
export class SecurityAuditor {
  private static instance: SecurityAuditor;
  private events: SecurityEvent[] = [];
  
  private constructor() {}
  
  static getInstance(): SecurityAuditor {
    if (!SecurityAuditor.instance) {
      SecurityAuditor.instance = new SecurityAuditor();
    }
    return SecurityAuditor.instance;
  }
  
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'id'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      // 清理敏感数据
      details: SensitiveDataSanitizer.sanitizeForLogging(event.details)
    };
    
    this.events.push(securityEvent);
    
    // 保持最近1000个事件
    if (this.events.length > 1000) {
      this.events.shift();
    }
    
    // 记录到控制台（生产环境应该发送到日志系统）
    console.log('安全事件:', JSON.stringify(securityEvent, null, 2));
    
    // 对于高危事件，立即告警
    if (event.severity === 'high' || event.severity === 'critical') {
      this.sendAlert(securityEvent);
    }
  }
  
  getEvents(filter?: {
    type?: string;
    severity?: SecuritySeverity;
    since?: Date;
  }): SecurityEvent[] {
    let filtered = this.events;
    
    if (filter?.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }
    
    if (filter?.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }
    
    if (filter?.since) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= filter.since!);
    }
    
    return filtered;
  }
  
  private sendAlert(event: SecurityEvent): void {
    // 这里应该实现实际的告警机制
    console.error('🚨 安全告警:', {
      type: event.type,
      severity: event.severity,
      message: event.message,
      timestamp: event.timestamp
    });
  }
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: SecuritySeverity;
  message: string;
  details?: any;
  userId?: string;
  ip?: string;
}

type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

// 使用示例
const auditor = SecurityAuditor.getInstance();

// 记录登录失败
auditor.logSecurityEvent({
  type: 'authentication_failure',
  severity: 'medium',
  message: 'API密钥验证失败',
  details: { apiKeyPrefix: 'sk-***', endpoint: '/api/chat' },
  ip: '192.168.1.100'
});

// 记录可疑活动
auditor.logSecurityEvent({
  type: 'suspicious_activity',
  severity: 'high',
  message: '检测到潜在的SQL注入尝试',
  details: { input: 'SELECT * FROM users; --', endpoint: '/api/search' },
  ip: '10.0.0.1'
});
```

### 2. 安全检查中间件

```typescript
// 安全检查中间件
export class SecurityMiddleware {
  private rateLimiter = new Map<string, { count: number; resetTime: number }>();
  private blockedIPs = new Set<string>();
  
  // 速率限制
  checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimiter.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.rateLimiter.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (record.count >= limit) {
      SecurityAuditor.getInstance().logSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        message: `速率限制超出: ${identifier}`,
        details: { identifier, count: record.count, limit }
      });
      return false;
    }
    
    record.count++;
    return true;
  }
  
  // IP黑名单检查
  checkIPBlacklist(ip: string): boolean {
    if (this.blockedIPs.has(ip)) {
      SecurityAuditor.getInstance().logSecurityEvent({
        type: 'blocked_ip_access',
        severity: 'high',
        message: `被阻止的IP尝试访问: ${ip}`,
        details: { ip }
      });
      return false;
    }
    return true;
  }
  
  // 添加IP到黑名单
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    SecurityAuditor.getInstance().logSecurityEvent({
      type: 'ip_blocked',
      severity: 'medium',
      message: `IP已被阻止: ${ip}`,
      details: { ip, reason }
    });
  }
  
  // 输入安全检查
  validateInput(input: any, schema: z.ZodSchema): boolean {
    try {
      schema.parse(input);
      return true;
    } catch (error) {
      SecurityAuditor.getInstance().logSecurityEvent({
        type: 'input_validation_failure',
        severity: 'medium',
        message: '输入验证失败',
        details: { 
          input: SensitiveDataSanitizer.sanitizeForLogging(input),
          error: error instanceof Error ? error.message : String(error)
        }
      });
      return false;
    }
  }
}
```

## 安全测试

### 1. 安全测试用例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('安全测试', () => {
  let secureValidator: any;
  
  beforeEach(() => {
    secureValidator = new SecurityMiddleware();
  });
  
  describe('输入验证', () => {
    it('应该阻止SQL注入尝试', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
        "1; DELETE FROM users WHERE 1=1; --"
      ];
      
      maliciousInputs.forEach(input => {
        expect(() => {
          sanitizeSqlInput(input);
        }).not.toThrow();
        
        // 验证危险字符被移除
        const sanitized = sanitizeSqlInput(input);
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('--');
      });
    });
    
    it('应该阻止XSS攻击', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">'
      ];
      
      xssPayloads.forEach(payload => {
        const sanitized = sanitizeHtml(payload);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
      });
    });
    
    it('应该阻止路径遍历攻击', () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '/etc/passwd',
        'C:\\Windows\\System32'
      ];
      
      const fileOp = new SecureFileOperator('/safe/base/path');
      
      pathTraversalAttempts.forEach(path => {
        expect(async () => {
          await fileOp.readFile(path);
        }).rejects.toThrow();
      });
    });
  });
  
  describe('速率限制', () => {
    it('应该正确实施速率限制', () => {
      const middleware = new SecurityMiddleware();
      const identifier = 'test-user';
      
      // 前100个请求应该通过
      for (let i = 0; i < 100; i++) {
        expect(middleware.checkRateLimit(identifier, 100, 60000)).toBe(true);
      }
      
      // 第101个请求应该被阻止
      expect(middleware.checkRateLimit(identifier, 100, 60000)).toBe(false);
    });
  });
  
  describe('密钥管理', () => {
    it('应该安全地存储和检索密钥', () => {
      const keyManager = SecureKeyManager.getInstance();
      const testKey = 'sk-test-key-12345';
      
      keyManager.storeKey('test', testKey);
      const retrieved = keyManager.getKey('test');
      
      expect(retrieved).toBe(testKey);
    });
    
    it('应该正确验证API密钥格式', () => {
      expect(ApiKeyValidator.validateKey('openai', 'sk-' + 'a'.repeat(48))).toBe(true);
      expect(ApiKeyValidator.validateKey('openai', 'invalid-key')).toBe(false);
    });
    
    it('应该正确掩码敏感信息', () => {
      const key = 'sk-1234567890abcdef';
      const masked = ApiKeyValidator.maskKey(key);
      
      expect(masked).toContain('sk-1');
      expect(masked).toContain('***');
      expect(masked).toContain('def');
      expect(masked).not.toContain('567890abcd');
    });
  });
});
```

## 总结

安全是插件开发的重要组成部分，需要：

1. **输入验证**：严格验证所有输入数据
2. **输出过滤**：清理输出中的敏感信息
3. **访问控制**：实施最小权限原则
4. **加密保护**：保护敏感数据和通信
5. **审计日志**：记录安全相关事件
6. **持续监控**：实时检测安全威胁

记住：**安全不是一次性的工作，而是持续的过程**。