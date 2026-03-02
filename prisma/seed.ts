import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing data...");
  await prisma.graphSnapshot.deleteMany();
  await prisma.inventoryUpload.deleteMany();
  await prisma.dependency.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.apiEndpoint.deleteMany();
  await prisma.package.deleteMany();
  await prisma.messageTopic.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.database.deleteMany();
  await prisma.service.deleteMany();
  await prisma.system.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();

  // ══════════════════════════════════════════════════════
  //  WORKSPACE
  // ══════════════════════════════════════════════════════

  console.log("Creating default workspace...");

  // Find or create seed user for workspace ownership
  let seedUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!seedUser) {
    seedUser = await prisma.user.create({
      data: {
        name: "Seed User",
        email: "seed@example.com",
      },
    });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "Default Workspace",
      slug: "default",
      description: "Default workspace for development",
      members: {
        create: { userId: seedUser.id, role: "OWNER" },
      },
    },
  });

  // ══════════════════════════════════════════════════════
  //  DOMAINS
  // ══════════════════════════════════════════════════════

  console.log("Creating domains...");

  const trading = await prisma.domain.create({
    data: { name: "Trading", description: "Core trading and order execution systems", workspaceId: workspace.id },
  });
  const onboarding = await prisma.domain.create({
    data: { name: "Onboarding", description: "Customer acquisition, KYC and account management", workspaceId: workspace.id },
  });
  const marketData = await prisma.domain.create({
    data: { name: "Market Data", description: "Real-time and historical market data distribution", workspaceId: workspace.id },
  });
  const settlement = await prisma.domain.create({
    data: { name: "Settlement", description: "Post-trade settlement, custody and transfers", workspaceId: workspace.id },
  });
  const riskCompliance = await prisma.domain.create({
    data: { name: "Risk & Compliance", description: "Risk management, regulatory compliance and audit", workspaceId: workspace.id },
  });
  const platform = await prisma.domain.create({
    data: { name: "Platform", description: "Shared infrastructure and cross-cutting services", workspaceId: workspace.id },
  });

  // ══════════════════════════════════════════════════════
  //  SYSTEMS
  // ══════════════════════════════════════════════════════

  console.log("Creating systems...");

  // ── Trading Domain ────────────────────────────────────

  const oms = await prisma.system.create({
    data: {
      name: "Order Management System",
      slug: "oms",
      purpose: "Receives orders from all channels, validates against risk limits, and routes to the trading engine for execution",
      language: "Java",
      framework: "Spring Boot",
      frameworkVersion: "3.2.0",
      repositoryUrl: "https://github.com/corretora/oms",
      domainId: trading.id,
    },
  });

  const tradingEngine = await prisma.system.create({
    data: {
      name: "Trading Engine",
      slug: "trading-engine",
      purpose: "High-performance order matching engine with sub-millisecond latency for B3 equities and derivatives",
      language: "Go",
      framework: "Custom",
      frameworkVersion: "1.0.0",
      repositoryUrl: "https://github.com/corretora/trading-engine",
      domainId: trading.id,
    },
  });

  const positionManager = await prisma.system.create({
    data: {
      name: "Position Manager",
      slug: "position-manager",
      purpose: "Real-time position tracking, P&L calculation, and margin monitoring across all asset classes",
      language: "Java",
      framework: "Spring Boot",
      frameworkVersion: "3.2.0",
      repositoryUrl: "https://github.com/corretora/position-manager",
      domainId: trading.id,
    },
  });

  const algoTrading = await prisma.system.create({
    data: {
      name: "Algo Trading Service",
      slug: "algo-trading",
      purpose: "Algorithmic trading strategies including VWAP, TWAP, and smart order routing",
      language: "Python",
      framework: "FastAPI",
      frameworkVersion: "0.109.0",
      repositoryUrl: "https://github.com/corretora/algo-trading",
      domainId: trading.id,
    },
  });

  // ── Onboarding Domain ─────────────────────────────────

  const customerPortal = await prisma.system.create({
    data: {
      name: "Customer Portal",
      slug: "customer-portal",
      purpose: "Web application for retail investors: trading, portfolio view, account management, and market research",
      language: "TypeScript",
      framework: "Next.js",
      frameworkVersion: "14.1.0",
      repositoryUrl: "https://github.com/corretora/customer-portal",
      domainId: onboarding.id,
    },
  });

  const mobileBff = await prisma.system.create({
    data: {
      name: "Mobile BFF",
      slug: "mobile-bff",
      purpose: "Backend-for-frontend aggregating data for the mobile app with optimized payloads and caching",
      language: "TypeScript",
      framework: "NestJS",
      frameworkVersion: "10.3.0",
      repositoryUrl: "https://github.com/corretora/mobile-bff",
      domainId: onboarding.id,
    },
  });

  const kycService = await prisma.system.create({
    data: {
      name: "KYC Service",
      slug: "kyc-service",
      purpose: "Know Your Customer verification: document OCR, facial recognition, PEP/sanctions screening, and risk scoring",
      language: "Python",
      framework: "FastAPI",
      frameworkVersion: "0.109.0",
      repositoryUrl: "https://github.com/corretora/kyc-service",
      domainId: onboarding.id,
    },
  });

  const accountService = await prisma.system.create({
    data: {
      name: "Account Service",
      slug: "account-service",
      purpose: "Account lifecycle management: creation, activation, suspension, closure, and investor profile classification (suitability)",
      language: "Java",
      framework: "Spring Boot",
      frameworkVersion: "3.2.0",
      repositoryUrl: "https://github.com/corretora/account-service",
      domainId: onboarding.id,
    },
  });

  // ── Market Data Domain ────────────────────────────────

  const marketDataFeed = await prisma.system.create({
    data: {
      name: "Market Data Feed",
      slug: "market-data-feed",
      purpose: "Real-time market data ingestion from B3 (UMDF/PUMA) and consolidated tape for equities, options, and futures",
      language: "C++",
      framework: "Custom",
      frameworkVersion: "2.5.0",
      repositoryUrl: "https://github.com/corretora/market-data-feed",
      domainId: marketData.id,
    },
  });

  const quoteService = await prisma.system.create({
    data: {
      name: "Quote Service",
      slug: "quote-service",
      purpose: "Distributes real-time and delayed quotes to internal consumers via gRPC streaming and WebSocket",
      language: "Go",
      framework: "Gin",
      frameworkVersion: "1.9.1",
      repositoryUrl: "https://github.com/corretora/quote-service",
      domainId: marketData.id,
    },
  });

  const historicalData = await prisma.system.create({
    data: {
      name: "Historical Data Service",
      slug: "historical-data",
      purpose: "Historical OHLCV data, technical indicators, and backtesting data API for all B3 instruments",
      language: "Python",
      framework: "FastAPI",
      frameworkVersion: "0.109.0",
      repositoryUrl: "https://github.com/corretora/historical-data",
      domainId: marketData.id,
    },
  });

  // ── Settlement Domain ─────────────────────────────────

  const settlementEngine = await prisma.system.create({
    data: {
      name: "Settlement Engine",
      slug: "settlement-engine",
      purpose: "Trade settlement processing for D+2 equities and D+1 derivatives, integration with B3 clearing (CBLC)",
      language: "Java",
      framework: "Spring Boot",
      frameworkVersion: "3.2.0",
      repositoryUrl: "https://github.com/corretora/settlement-engine",
      domainId: settlement.id,
    },
  });

  const custodyService = await prisma.system.create({
    data: {
      name: "Custody Service",
      slug: "custody-service",
      purpose: "Asset custody, corporate actions processing, and position reconciliation with B3 central depository",
      language: "Java",
      framework: "Spring Boot",
      frameworkVersion: "3.2.0",
      repositoryUrl: "https://github.com/corretora/custody-service",
      domainId: settlement.id,
    },
  });

  const transferService = await prisma.system.create({
    data: {
      name: "Transfer Service",
      slug: "transfer-service",
      purpose: "Money transfers via TED, PIX, and DOC; manages daily transfer limits and anti-fraud checks",
      language: "Kotlin",
      framework: "Spring Boot",
      frameworkVersion: "3.2.0",
      repositoryUrl: "https://github.com/corretora/transfer-service",
      domainId: settlement.id,
    },
  });

  // ── Risk & Compliance Domain ──────────────────────────

  const riskEngine = await prisma.system.create({
    data: {
      name: "Risk Engine",
      slug: "risk-engine",
      purpose: "Pre-trade and post-trade risk analysis: margin calculation, exposure limits, VaR, and stress testing",
      language: "Python",
      framework: "FastAPI",
      frameworkVersion: "0.109.0",
      repositoryUrl: "https://github.com/corretora/risk-engine",
      domainId: riskCompliance.id,
    },
  });

  const complianceService = await prisma.system.create({
    data: {
      name: "Compliance Service",
      slug: "compliance-service",
      purpose: "Regulatory reporting to CVM/BACEN, AML transaction monitoring, suspicious activity detection",
      language: "Java",
      framework: "Spring Boot",
      frameworkVersion: "3.2.0",
      repositoryUrl: "https://github.com/corretora/compliance-service",
      domainId: riskCompliance.id,
    },
  });

  const auditTrail = await prisma.system.create({
    data: {
      name: "Audit Trail",
      slug: "audit-trail",
      purpose: "Immutable event log for all system operations, meeting CVM regulatory requirements for 5-year retention",
      language: "Go",
      framework: "Gin",
      frameworkVersion: "1.9.1",
      repositoryUrl: "https://github.com/corretora/audit-trail",
      domainId: riskCompliance.id,
    },
  });

  // ── Platform Domain ───────────────────────────────────

  const apiGateway = await prisma.system.create({
    data: {
      name: "API Gateway",
      slug: "api-gateway",
      purpose: "Edge gateway handling authentication, rate limiting, request routing, and API versioning for all public endpoints",
      language: "TypeScript",
      framework: "Express",
      frameworkVersion: "4.18.2",
      repositoryUrl: "https://github.com/corretora/api-gateway",
      domainId: platform.id,
    },
  });

  const authService = await prisma.system.create({
    data: {
      name: "Auth Service",
      slug: "auth-service",
      purpose: "Centralized authentication: JWT issuance/validation, OAuth2 flows, MFA (TOTP/SMS), and session management",
      language: "Go",
      framework: "Gin",
      frameworkVersion: "1.9.1",
      repositoryUrl: "https://github.com/corretora/auth-service",
      domainId: platform.id,
    },
  });

  const notificationService = await prisma.system.create({
    data: {
      name: "Notification Service",
      slug: "notification-service",
      purpose: "Multi-channel notifications: email (transactional/marketing), SMS, push notifications, and in-app messages",
      language: "TypeScript",
      framework: "NestJS",
      frameworkVersion: "10.3.0",
      repositoryUrl: "https://github.com/corretora/notification-service",
      domainId: platform.id,
    },
  });

  // ══════════════════════════════════════════════════════
  //  SERVICES (microservices / workers / crons)
  // ══════════════════════════════════════════════════════

  console.log("Creating services...");

  await prisma.service.createMany({
    data: [
      // Trading
      { name: "oms-api", slug: "oms-api", type: "API", systemId: oms.id },
      { name: "oms-order-worker", slug: "oms-order-worker", type: "WORKER", systemId: oms.id },
      { name: "oms-expiry-scheduler", slug: "oms-expiry-scheduler", type: "CRONJOB", systemId: oms.id },
      { name: "trading-engine-core", slug: "trading-engine-core", type: "API", systemId: tradingEngine.id },
      { name: "trading-engine-fix-gateway", slug: "trading-engine-fix-gateway", type: "BACKGROUND_SERVICE", systemId: tradingEngine.id },
      { name: "position-manager-api", slug: "position-manager-api", type: "API", systemId: positionManager.id },
      { name: "position-manager-calculator", slug: "position-manager-calculator", type: "WORKER", systemId: positionManager.id },
      { name: "position-eod-job", slug: "position-eod-job", type: "CRONJOB", systemId: positionManager.id },
      { name: "algo-trading-api", slug: "algo-trading-api", type: "API", systemId: algoTrading.id },
      { name: "algo-strategy-runner", slug: "algo-strategy-runner", type: "WORKER", systemId: algoTrading.id },
      // Onboarding
      { name: "customer-portal-web", slug: "customer-portal-web", type: "API", systemId: customerPortal.id },
      { name: "mobile-bff-api", slug: "mobile-bff-api", type: "API", systemId: mobileBff.id },
      { name: "mobile-bff-cache-warmer", slug: "mobile-bff-cache-warmer", type: "CRONJOB", systemId: mobileBff.id },
      { name: "kyc-api", slug: "kyc-api", type: "API", systemId: kycService.id },
      { name: "kyc-document-processor", slug: "kyc-document-processor", type: "WORKER", systemId: kycService.id },
      { name: "account-api", slug: "account-api", type: "API", systemId: accountService.id },
      { name: "account-event-publisher", slug: "account-event-publisher", type: "WORKER", systemId: accountService.id },
      // Market Data
      { name: "market-data-ingestion", slug: "market-data-ingestion", type: "BACKGROUND_SERVICE", systemId: marketDataFeed.id },
      { name: "market-data-normalizer", slug: "market-data-normalizer", type: "WORKER", systemId: marketDataFeed.id },
      { name: "quote-service-api", slug: "quote-service-api", type: "API", systemId: quoteService.id },
      { name: "quote-ws-server", slug: "quote-ws-server", type: "BACKGROUND_SERVICE", systemId: quoteService.id },
      { name: "historical-data-api", slug: "historical-data-api", type: "API", systemId: historicalData.id },
      { name: "historical-data-aggregator", slug: "historical-data-aggregator", type: "CRONJOB", systemId: historicalData.id },
      // Settlement
      { name: "settlement-api", slug: "settlement-api", type: "API", systemId: settlementEngine.id },
      { name: "settlement-processor", slug: "settlement-processor", type: "WORKER", systemId: settlementEngine.id },
      { name: "settlement-reconciliation", slug: "settlement-reconciliation", type: "CRONJOB", systemId: settlementEngine.id },
      { name: "custody-api", slug: "custody-api", type: "API", systemId: custodyService.id },
      { name: "custody-corporate-actions", slug: "custody-corporate-actions", type: "WORKER", systemId: custodyService.id },
      { name: "transfer-api", slug: "transfer-api", type: "API", systemId: transferService.id },
      { name: "transfer-pix-worker", slug: "transfer-pix-worker", type: "WORKER", systemId: transferService.id },
      { name: "transfer-ted-scheduler", slug: "transfer-ted-scheduler", type: "CRONJOB", systemId: transferService.id },
      // Risk & Compliance
      { name: "risk-engine-api", slug: "risk-engine-api", type: "API", systemId: riskEngine.id },
      { name: "risk-margin-calculator", slug: "risk-margin-calculator", type: "WORKER", systemId: riskEngine.id },
      { name: "risk-eod-var", slug: "risk-eod-var", type: "CRONJOB", systemId: riskEngine.id },
      { name: "compliance-api", slug: "compliance-api", type: "API", systemId: complianceService.id },
      { name: "compliance-aml-scanner", slug: "compliance-aml-scanner", type: "WORKER", systemId: complianceService.id },
      { name: "compliance-cvm-reporter", slug: "compliance-cvm-reporter", type: "CRONJOB", systemId: complianceService.id },
      { name: "audit-trail-api", slug: "audit-trail-api", type: "API", systemId: auditTrail.id },
      { name: "audit-trail-indexer", slug: "audit-trail-indexer", type: "WORKER", systemId: auditTrail.id },
      // Platform
      { name: "api-gateway-proxy", slug: "api-gateway-proxy", type: "API", systemId: apiGateway.id },
      { name: "auth-service-api", slug: "auth-service-api", type: "API", systemId: authService.id },
      { name: "auth-token-cleanup", slug: "auth-token-cleanup", type: "CRONJOB", systemId: authService.id },
      { name: "notification-api", slug: "notification-api", type: "API", systemId: notificationService.id },
      { name: "notification-email-worker", slug: "notification-email-worker", type: "WORKER", systemId: notificationService.id },
      { name: "notification-sms-worker", slug: "notification-sms-worker", type: "WORKER", systemId: notificationService.id },
    ],
  });

  // ══════════════════════════════════════════════════════
  //  DATABASES
  // ══════════════════════════════════════════════════════

  console.log("Creating databases...");

  await prisma.database.createMany({
    data: [
      { name: "oms_db", provider: "PostgreSQL", version: "16", orm: "Hibernate", tables: ["orders", "order_history", "order_legs", "execution_reports"], systemId: oms.id },
      { name: "oms_cache", provider: "Redis", version: "7.2", systemId: oms.id },
      { name: "trading_engine_state", provider: "Redis", version: "7.2", systemId: tradingEngine.id },
      { name: "positions_db", provider: "PostgreSQL", version: "16", orm: "Hibernate", tables: ["positions", "pnl_daily", "margin_requirements", "asset_prices"], systemId: positionManager.id },
      { name: "algo_db", provider: "PostgreSQL", version: "16", orm: "SQLAlchemy", tables: ["strategies", "strategy_runs", "order_slices", "performance_metrics"], systemId: algoTrading.id },
      { name: "portal_cache", provider: "Redis", version: "7.2", systemId: customerPortal.id },
      { name: "bff_cache", provider: "Redis", version: "7.2", systemId: mobileBff.id },
      { name: "kyc_db", provider: "PostgreSQL", version: "16", orm: "SQLAlchemy", tables: ["kyc_requests", "documents", "verification_results", "pep_screening"], systemId: kycService.id },
      { name: "kyc_documents", provider: "MongoDB", version: "7.0", systemId: kycService.id },
      { name: "accounts_db", provider: "PostgreSQL", version: "16", orm: "Hibernate", tables: ["accounts", "investor_profiles", "suitability_scores", "account_status_history"], systemId: accountService.id },
      { name: "market_data_buffer", provider: "Redis", version: "7.2", systemId: marketDataFeed.id },
      { name: "quotes_cache", provider: "Redis", version: "7.2", systemId: quoteService.id },
      { name: "historical_db", provider: "TimescaleDB", version: "2.13", orm: "SQLAlchemy", tables: ["ohlcv_1m", "ohlcv_5m", "ohlcv_1d", "tick_data", "instruments"], systemId: historicalData.id },
      { name: "settlement_db", provider: "PostgreSQL", version: "16", orm: "Hibernate", tables: ["trades_to_settle", "settlement_instructions", "netting_positions", "clearing_records"], systemId: settlementEngine.id },
      { name: "settlement_db", provider: "PostgreSQL", version: "16", orm: "Hibernate", tables: ["custody_positions", "corporate_actions", "asset_movements"], systemId: custodyService.id },
      { name: "transfers_db", provider: "PostgreSQL", version: "16", orm: "Exposed", tables: ["transfers", "pix_keys", "transfer_limits", "fraud_checks"], systemId: transferService.id },
      { name: "risk_db", provider: "PostgreSQL", version: "16", orm: "SQLAlchemy", tables: ["risk_limits", "margin_calls", "var_results", "stress_scenarios"], systemId: riskEngine.id },
      { name: "risk_timeseries", provider: "TimescaleDB", version: "2.13", tables: ["exposure_history", "margin_history"], systemId: riskEngine.id },
      { name: "compliance_db", provider: "PostgreSQL", version: "16", orm: "Hibernate", tables: ["aml_alerts", "regulatory_reports", "suspicious_activities", "watchlists"], systemId: complianceService.id },
      { name: "audit_events", provider: "ClickHouse", version: "24.1", tables: ["events", "events_by_user", "events_by_system"], systemId: auditTrail.id },
      { name: "gateway_rate_limits", provider: "Redis", version: "7.2", systemId: apiGateway.id },
      { name: "auth_db", provider: "PostgreSQL", version: "16", orm: "GORM", tables: ["users", "sessions", "refresh_tokens", "mfa_devices"], systemId: authService.id },
      { name: "auth_sessions", provider: "Redis", version: "7.2", systemId: authService.id },
      { name: "notifications_db", provider: "PostgreSQL", version: "16", orm: "Prisma", tables: ["notifications", "templates", "delivery_log", "preferences"], systemId: notificationService.id },
    ],
  });

  // ══════════════════════════════════════════════════════
  //  INTEGRATIONS
  // ══════════════════════════════════════════════════════

  console.log("Creating integrations...");

  await prisma.integration.createMany({
    data: [
      { name: "API Gateway", type: "HTTP_API", targetSystem: "api-gateway", url: "https://api.corretora.com.br", protocol: "REST", systemId: customerPortal.id },
      { name: "API Gateway", type: "HTTP_API", targetSystem: "api-gateway", url: "https://api.corretora.com.br", protocol: "REST", systemId: mobileBff.id },
      { name: "Order Management", type: "HTTP_API", targetSystem: "oms", url: "http://oms:8080", protocol: "REST", systemId: apiGateway.id },
      { name: "Account Service", type: "HTTP_API", targetSystem: "account-service", url: "http://account-service:8080", protocol: "REST", systemId: apiGateway.id },
      { name: "Quote Service", type: "HTTP_API", targetSystem: "quote-service", url: "http://quote-service:8080", protocol: "REST", systemId: apiGateway.id },
      { name: "Historical Data", type: "HTTP_API", targetSystem: "historical-data", url: "http://historical-data:8080", protocol: "REST", systemId: apiGateway.id },
      { name: "Trading Engine", type: "GRPC", targetSystem: "trading-engine", protocol: "gRPC", systemId: oms.id },
      { name: "Risk Engine", type: "HTTP_API", targetSystem: "risk-engine", url: "http://risk-engine:8000", protocol: "REST", systemId: oms.id },
      { name: "Quote Service", type: "HTTP_API", targetSystem: "quote-service", url: "http://quote-service:8080", protocol: "REST", systemId: positionManager.id },
      { name: "OMS", type: "HTTP_API", targetSystem: "oms", url: "http://oms:8080", protocol: "REST", systemId: algoTrading.id },
      { name: "Quote Service Streaming", type: "GRPC", targetSystem: "quote-service", protocol: "gRPC", systemId: algoTrading.id },
      { name: "Market Data Feed", type: "GRPC", targetSystem: "market-data-feed", protocol: "gRPC", systemId: quoteService.id },
      { name: "Account Service", type: "HTTP_API", targetSystem: "account-service", url: "http://account-service:8080", protocol: "REST", systemId: kycService.id },
      { name: "Custody Service", type: "HTTP_API", targetSystem: "custody-service", url: "http://custody-service:8080", protocol: "REST", systemId: settlementEngine.id },
      { name: "Transfer Service", type: "HTTP_API", targetSystem: "transfer-service", url: "http://transfer-service:8080", protocol: "REST", systemId: settlementEngine.id },
      { name: "Position Manager", type: "HTTP_API", targetSystem: "position-manager", url: "http://position-manager:8080", protocol: "REST", systemId: riskEngine.id },
      { name: "Account Service", type: "HTTP_API", targetSystem: "account-service", url: "http://account-service:8080", protocol: "REST", systemId: complianceService.id },
      { name: "Audit Trail", type: "GRPC", targetSystem: "audit-trail", protocol: "gRPC", systemId: complianceService.id },
    ],
  });

  // ══════════════════════════════════════════════════════
  //  MESSAGE TOPICS (Kafka)
  // ══════════════════════════════════════════════════════

  console.log("Creating message topics...");

  await prisma.messageTopic.createMany({
    data: [
      // trades.executed
      { name: "trades.executed", role: "PRODUCER", broker: "KAFKA", systemId: tradingEngine.id },
      { name: "trades.executed", role: "CONSUMER", broker: "KAFKA", systemId: positionManager.id, metadata: { consumerGroup: "position-manager-cg" } },
      { name: "trades.executed", role: "CONSUMER", broker: "KAFKA", systemId: settlementEngine.id, metadata: { consumerGroup: "settlement-engine-cg" } },
      { name: "trades.executed", role: "CONSUMER", broker: "KAFKA", systemId: complianceService.id, metadata: { consumerGroup: "compliance-trades-cg" } },
      // market.ticks
      { name: "market.ticks", role: "PRODUCER", broker: "KAFKA", systemId: marketDataFeed.id },
      { name: "market.ticks", role: "CONSUMER", broker: "KAFKA", systemId: historicalData.id, metadata: { consumerGroup: "historical-data-cg" } },
      { name: "market.ticks", role: "CONSUMER", broker: "KAFKA", systemId: algoTrading.id, metadata: { consumerGroup: "algo-trading-cg" } },
      // accounts.events
      { name: "accounts.events", role: "PRODUCER", broker: "KAFKA", systemId: accountService.id },
      { name: "accounts.events", role: "CONSUMER", broker: "KAFKA", systemId: notificationService.id, metadata: { consumerGroup: "notification-accounts-cg" } },
      { name: "accounts.events", role: "CONSUMER", broker: "KAFKA", systemId: complianceService.id, metadata: { consumerGroup: "compliance-accounts-cg" } },
      // settlement.completed
      { name: "settlement.completed", role: "PRODUCER", broker: "KAFKA", systemId: settlementEngine.id },
      { name: "settlement.completed", role: "CONSUMER", broker: "KAFKA", systemId: notificationService.id, metadata: { consumerGroup: "notification-settlement-cg" } },
      { name: "settlement.completed", role: "CONSUMER", broker: "KAFKA", systemId: transferService.id, metadata: { consumerGroup: "transfer-settlement-cg" } },
      // kyc.verified
      { name: "kyc.verified", role: "PRODUCER", broker: "KAFKA", systemId: kycService.id },
      { name: "kyc.verified", role: "CONSUMER", broker: "KAFKA", systemId: accountService.id, metadata: { consumerGroup: "account-kyc-cg" } },
      // orders.submitted
      { name: "orders.submitted", role: "PRODUCER", broker: "KAFKA", systemId: oms.id },
      { name: "orders.submitted", role: "CONSUMER", broker: "KAFKA", systemId: notificationService.id, metadata: { consumerGroup: "notification-orders-cg" } },
      // risk.alerts
      { name: "risk.alerts", role: "PRODUCER", broker: "KAFKA", systemId: riskEngine.id },
      { name: "risk.alerts", role: "CONSUMER", broker: "KAFKA", systemId: notificationService.id, metadata: { consumerGroup: "notification-risk-cg" } },
      { name: "risk.alerts", role: "CONSUMER", broker: "KAFKA", systemId: complianceService.id, metadata: { consumerGroup: "compliance-risk-cg" } },
    ],
  });

  // ══════════════════════════════════════════════════════
  //  PACKAGES
  // ══════════════════════════════════════════════════════

  console.log("Creating packages...");

  await prisma.package.createMany({
    data: [
      // Shared internal: company-auth-sdk
      { name: "company-auth-sdk", version: "3.1.0", scope: "INTERNAL", systemId: oms.id },
      { name: "company-auth-sdk", version: "3.1.0", scope: "INTERNAL", systemId: accountService.id },
      { name: "company-auth-sdk", version: "3.1.0", scope: "INTERNAL", systemId: apiGateway.id },
      { name: "company-auth-sdk", version: "3.1.0", scope: "INTERNAL", systemId: settlementEngine.id },
      { name: "company-auth-sdk", version: "3.1.0", scope: "INTERNAL", systemId: riskEngine.id },
      { name: "company-auth-sdk", version: "3.1.0", scope: "INTERNAL", systemId: notificationService.id },
      // Shared internal: company-logging-lib
      { name: "company-logging-lib", version: "2.0.0", scope: "INTERNAL", systemId: oms.id },
      { name: "company-logging-lib", version: "2.0.0", scope: "INTERNAL", systemId: tradingEngine.id },
      { name: "company-logging-lib", version: "2.0.0", scope: "INTERNAL", systemId: positionManager.id },
      { name: "company-logging-lib", version: "2.0.0", scope: "INTERNAL", systemId: settlementEngine.id },
      // OMS
      { name: "spring-boot-starter-web", version: "3.2.0", scope: "OPEN_SOURCE", systemId: oms.id },
      { name: "spring-kafka", version: "3.1.0", scope: "OPEN_SOURCE", systemId: oms.id },
      { name: "grpc-spring-boot-starter", version: "2.15.0", scope: "OPEN_SOURCE", systemId: oms.id },
      { name: "junit-jupiter", version: "5.10.0", scope: "TEST", systemId: oms.id },
      // Trading Engine
      { name: "protobuf", version: "1.32.0", scope: "OPEN_SOURCE", systemId: tradingEngine.id },
      { name: "go-redis", version: "9.4.0", scope: "OPEN_SOURCE", systemId: tradingEngine.id },
      { name: "confluent-kafka-go", version: "2.3.0", scope: "OPEN_SOURCE", systemId: tradingEngine.id },
      // Customer Portal
      { name: "react", version: "18.2.0", scope: "OPEN_SOURCE", systemId: customerPortal.id },
      { name: "next", version: "14.1.0", scope: "OPEN_SOURCE", systemId: customerPortal.id },
      { name: "tailwindcss", version: "3.4.0", scope: "OPEN_SOURCE", systemId: customerPortal.id },
      { name: "trading-charts-lib", version: "1.5.0", scope: "INTERNAL", systemId: customerPortal.id },
      // KYC
      { name: "fastapi", version: "0.109.0", scope: "OPEN_SOURCE", systemId: kycService.id },
      { name: "opencv-python", version: "4.9.0", scope: "OPEN_SOURCE", systemId: kycService.id },
      { name: "tesseract-ocr", version: "0.3.13", scope: "OPEN_SOURCE", systemId: kycService.id },
      // Risk Engine
      { name: "fastapi", version: "0.109.0", scope: "OPEN_SOURCE", systemId: riskEngine.id },
      { name: "numpy", version: "1.26.0", scope: "OPEN_SOURCE", systemId: riskEngine.id },
      { name: "scipy", version: "1.12.0", scope: "OPEN_SOURCE", systemId: riskEngine.id },
      { name: "pandas", version: "2.2.0", scope: "OPEN_SOURCE", systemId: riskEngine.id },
      // Algo Trading
      { name: "fastapi", version: "0.109.0", scope: "OPEN_SOURCE", systemId: algoTrading.id },
      { name: "numpy", version: "1.26.0", scope: "OPEN_SOURCE", systemId: algoTrading.id },
      { name: "company-algo-framework", version: "1.2.0", scope: "INTERNAL", systemId: algoTrading.id },
      // Auth
      { name: "gin", version: "1.9.1", scope: "OPEN_SOURCE", systemId: authService.id },
      { name: "golang-jwt", version: "5.2.0", scope: "OPEN_SOURCE", systemId: authService.id },
      { name: "go-totp", version: "1.4.0", scope: "OPEN_SOURCE", systemId: authService.id },
      // Notification
      { name: "@nestjs/core", version: "10.3.0", scope: "OPEN_SOURCE", systemId: notificationService.id },
      { name: "@nestjs/bull", version: "10.1.0", scope: "OPEN_SOURCE", systemId: notificationService.id },
      { name: "nodemailer", version: "6.9.8", scope: "OPEN_SOURCE", systemId: notificationService.id },
    ],
  });

  // ══════════════════════════════════════════════════════
  //  API ENDPOINTS
  // ══════════════════════════════════════════════════════

  console.log("Creating API endpoints...");

  await prisma.apiEndpoint.createMany({
    data: [
      { path: "/api/v1/orders", method: "POST", description: "Submit a new order", systemId: oms.id },
      { path: "/api/v1/orders/:id", method: "GET", description: "Get order by ID", systemId: oms.id },
      { path: "/api/v1/orders/:id/cancel", method: "POST", description: "Cancel an order", systemId: oms.id },
      { path: "/api/v1/orders", method: "GET", description: "List orders with filters", systemId: oms.id },
      { path: "/api/v1/execute", method: "POST", description: "Execute order (internal gRPC)", systemId: tradingEngine.id },
      { path: "/api/v1/orderbook/:instrument", method: "GET", description: "Get order book snapshot", systemId: tradingEngine.id },
      { path: "/api/v1/positions", method: "GET", description: "List all positions", systemId: positionManager.id },
      { path: "/api/v1/positions/:account", method: "GET", description: "Get positions by account", systemId: positionManager.id },
      { path: "/api/v1/pnl/:account", method: "GET", description: "Get P&L for account", systemId: positionManager.id },
      { path: "/api/v1/accounts", method: "POST", description: "Create investor account", systemId: accountService.id },
      { path: "/api/v1/accounts/:id", method: "GET", description: "Get account details", systemId: accountService.id },
      { path: "/api/v1/accounts/:id/suitability", method: "PUT", description: "Update suitability profile", systemId: accountService.id },
      { path: "/api/v1/accounts/:id/status", method: "PATCH", description: "Change account status", systemId: accountService.id },
      { path: "/api/v1/kyc/submit", method: "POST", description: "Submit KYC documents", systemId: kycService.id },
      { path: "/api/v1/kyc/:id/status", method: "GET", description: "Check KYC verification status", systemId: kycService.id },
      { path: "/api/v1/quotes/:instrument", method: "GET", description: "Get latest quote", systemId: quoteService.id },
      { path: "/api/v1/quotes/batch", method: "POST", description: "Get batch quotes", systemId: quoteService.id },
      { path: "/ws/quotes", method: "GET", description: "WebSocket real-time quotes", systemId: quoteService.id },
      { path: "/api/v1/candles/:instrument", method: "GET", description: "Get OHLCV candles", systemId: historicalData.id },
      { path: "/api/v1/indicators/:instrument", method: "GET", description: "Get technical indicators", systemId: historicalData.id },
      { path: "/api/v1/settlements", method: "GET", description: "List pending settlements", systemId: settlementEngine.id },
      { path: "/api/v1/settlements/:id/confirm", method: "POST", description: "Confirm settlement", systemId: settlementEngine.id },
      { path: "/api/v1/custody/positions", method: "GET", description: "Get custody positions", systemId: custodyService.id },
      { path: "/api/v1/custody/corporate-actions", method: "GET", description: "List corporate actions", systemId: custodyService.id },
      { path: "/api/v1/transfers/pix", method: "POST", description: "Initiate PIX transfer", systemId: transferService.id },
      { path: "/api/v1/transfers/ted", method: "POST", description: "Initiate TED transfer", systemId: transferService.id },
      { path: "/api/v1/transfers/:id", method: "GET", description: "Get transfer status", systemId: transferService.id },
      { path: "/api/v1/risk/check", method: "POST", description: "Pre-trade risk check", systemId: riskEngine.id },
      { path: "/api/v1/risk/margin/:account", method: "GET", description: "Get margin requirements", systemId: riskEngine.id },
      { path: "/api/v1/risk/var", method: "GET", description: "Get Value at Risk", systemId: riskEngine.id },
      { path: "/api/v1/compliance/alerts", method: "GET", description: "List AML alerts", systemId: complianceService.id },
      { path: "/api/v1/compliance/reports", method: "POST", description: "Generate regulatory report", systemId: complianceService.id },
      { path: "/api/v1/events", method: "POST", description: "Record audit event", systemId: auditTrail.id },
      { path: "/api/v1/events/search", method: "GET", description: "Search audit events", systemId: auditTrail.id },
      { path: "/api/v1/auth/login", method: "POST", description: "Authenticate user", systemId: authService.id },
      { path: "/api/v1/auth/refresh", method: "POST", description: "Refresh JWT token", systemId: authService.id },
      { path: "/api/v1/auth/mfa/verify", method: "POST", description: "Verify MFA code", systemId: authService.id },
      { path: "/api/v1/notifications/send", method: "POST", description: "Send notification", systemId: notificationService.id },
      { path: "/api/v1/notifications/preferences", method: "PUT", description: "Update notification preferences", systemId: notificationService.id },
      { path: "/api/v1/strategies", method: "GET", description: "List trading strategies", systemId: algoTrading.id },
      { path: "/api/v1/strategies/:id/start", method: "POST", description: "Start strategy execution", systemId: algoTrading.id },
      { path: "/api/v1/strategies/:id/stop", method: "POST", description: "Stop strategy execution", systemId: algoTrading.id },
    ],
  });

  // ══════════════════════════════════════════════════════
  //  RISKS
  // ══════════════════════════════════════════════════════

  console.log("Creating risks...");

  await prisma.risk.createMany({
    data: [
      { title: "No circuit breaker on Trading Engine gRPC calls", description: "gRPC calls to trading engine lack circuit breaker; a trading engine outage could cascade to OMS", severity: "HIGH", systemId: oms.id },
      { title: "Order validation bypass for institutional clients", description: "Institutional API allows orders without full pre-trade risk validation", severity: "CRITICAL", systemId: oms.id },
      { title: "Single point of failure for order matching", description: "No active-active HA setup; failover relies on manual switchover", severity: "CRITICAL", systemId: tradingEngine.id },
      { title: "Memory leak under high market volatility", description: "Order book data structure grows unbounded during flash crash scenarios", severity: "HIGH", systemId: tradingEngine.id },
      { title: "P&L calculation delay during market open", description: "Mark-to-market recalculation can lag 30s+ when market opens with high volatility", severity: "MEDIUM", systemId: positionManager.id },
      { title: "Missing reconciliation with B3 positions", description: "No automated daily reconciliation between internal positions and B3 central depository", severity: "HIGH", systemId: positionManager.id },
      { title: "XSS vulnerability in order notes field", description: "User-supplied order notes not properly sanitized before rendering", severity: "HIGH", systemId: customerPortal.id },
      { title: "No rate limiting on login attempts", description: "Brute-force protection relies solely on CAPTCHA after 5 attempts", severity: "MEDIUM", systemId: customerPortal.id },
      { title: "OCR accuracy below threshold for RG documents", description: "Document OCR has <85% accuracy for older RG format, causing manual review backlog", severity: "MEDIUM", systemId: kycService.id },
      { title: "PEP screening data staleness", description: "PEP/sanctions list updated only weekly; should be daily per CVM regulations", severity: "HIGH", systemId: kycService.id },
      { title: "Account creation race condition", description: "Concurrent KYC verification events can create duplicate accounts for same CPF", severity: "HIGH", systemId: accountService.id },
      { title: "B3 UMDF protocol version outdated", description: "Running UMDF 1.x; B3 plans to deprecate in favor of UMDF 2.0 by Q3", severity: "MEDIUM", systemId: marketDataFeed.id },
      { title: "No graceful degradation on feed disconnect", description: "Market data feed does not switch to backup multicast group on primary failure", severity: "CRITICAL", systemId: marketDataFeed.id },
      { title: "WebSocket connection limit", description: "WebSocket server limited to 10k concurrent connections; approaching limit during peak hours", severity: "MEDIUM", systemId: quoteService.id },
      { title: "TimescaleDB compression not configured", description: "Historical tick data growing at 50GB/month without compression; storage costs escalating", severity: "LOW", systemId: historicalData.id },
      { title: "Settlement window missed for derivatives", description: "D+1 settlement for derivatives occasionally misses CBLC cutoff time due to processing delays", severity: "CRITICAL", systemId: settlementEngine.id },
      { title: "No retry mechanism for failed settlement instructions", description: "Failed B3 settlement instructions require manual resubmission", severity: "HIGH", systemId: settlementEngine.id },
      { title: "Corporate action processing delay", description: "Stock split and dividend events processed manually; should be automated from B3 feed", severity: "MEDIUM", systemId: custodyService.id },
      { title: "PIX transfer idempotency not guaranteed", description: "Duplicate PIX requests within same second can result in double transfers", severity: "CRITICAL", systemId: transferService.id },
      { title: "TED processing outside BACEN hours", description: "TED requests after 17:00 queued without clear user feedback on next-day processing", severity: "LOW", systemId: transferService.id },
      { title: "VaR model using outdated volatility data", description: "Historical VaR model uses 1-year lookback; should include stress period weighting", severity: "HIGH", systemId: riskEngine.id },
      { title: "Margin call notification delay", description: "Margin call alerts can be delayed up to 15 minutes during high-volume periods", severity: "HIGH", systemId: riskEngine.id },
      { title: "AML rule engine false positive rate", description: "AML transaction monitoring has 40% false positive rate, overwhelming compliance team", severity: "MEDIUM", systemId: complianceService.id },
      { title: "CVM daily report submission occasionally fails", description: "Automated CVM report submission fails silently when B3 portal is under maintenance", severity: "HIGH", systemId: complianceService.id },
      { title: "Event ingestion backpressure", description: "ClickHouse ingestion can fall behind during peak trading hours, causing event loss", severity: "HIGH", systemId: auditTrail.id },
      { title: "Rate limiter not distributed", description: "Rate limiting is per-pod, not distributed; users can exceed limits by hitting different pods", severity: "MEDIUM", systemId: apiGateway.id },
      { title: "Missing request body size limit", description: "No max request body size configured; vulnerable to large payload attacks", severity: "HIGH", systemId: apiGateway.id },
      { title: "JWT secret rotation not automated", description: "JWT signing key rotation requires manual deployment; should be automated via vault", severity: "MEDIUM", systemId: authService.id },
      { title: "Email delivery rate throttled by provider", description: "SendGrid rate limit causing delayed order confirmation emails during peak", severity: "LOW", systemId: notificationService.id },
      { title: "SMS fallback not implemented", description: "If primary SMS provider (Twilio) is down, no fallback to secondary provider", severity: "MEDIUM", systemId: notificationService.id },
      { title: "Strategy race condition on position updates", description: "Concurrent strategy instances can submit conflicting orders on same instrument", severity: "HIGH", systemId: algoTrading.id },
      { title: "No kill switch for runaway algorithms", description: "Missing automated circuit breaker to halt algo trading when loss exceeds threshold", severity: "CRITICAL", systemId: algoTrading.id },
    ],
  });

  // ══════════════════════════════════════════════════════
  //  DEPENDENCIES
  // ══════════════════════════════════════════════════════

  console.log("Creating dependencies...");

  await prisma.dependency.createMany({
    data: [
      // HTTP_API
      { sourceId: customerPortal.id, targetId: apiGateway.id, type: "HTTP_API", label: "Web Client" },
      { sourceId: mobileBff.id, targetId: apiGateway.id, type: "HTTP_API", label: "Mobile BFF" },
      { sourceId: apiGateway.id, targetId: oms.id, type: "HTTP_API", label: "Order Routing" },
      { sourceId: apiGateway.id, targetId: accountService.id, type: "HTTP_API", label: "Account Mgmt" },
      { sourceId: apiGateway.id, targetId: quoteService.id, type: "HTTP_API", label: "Quotes" },
      { sourceId: apiGateway.id, targetId: historicalData.id, type: "HTTP_API", label: "Historical Data" },
      { sourceId: oms.id, targetId: riskEngine.id, type: "HTTP_API", label: "Pre-trade Risk" },
      { sourceId: positionManager.id, targetId: quoteService.id, type: "HTTP_API", label: "Mark-to-Market" },
      { sourceId: settlementEngine.id, targetId: custodyService.id, type: "HTTP_API", label: "Custody Update" },
      { sourceId: settlementEngine.id, targetId: transferService.id, type: "HTTP_API", label: "Cash Settlement" },
      { sourceId: kycService.id, targetId: accountService.id, type: "HTTP_API", label: "Account Creation" },
      { sourceId: riskEngine.id, targetId: positionManager.id, type: "HTTP_API", label: "Position Query" },
      { sourceId: algoTrading.id, targetId: oms.id, type: "HTTP_API", label: "Order Submission" },
      { sourceId: complianceService.id, targetId: accountService.id, type: "HTTP_API", label: "AML Queries" },
      // GRPC
      { sourceId: oms.id, targetId: tradingEngine.id, type: "GRPC", label: "Order Execution" },
      { sourceId: quoteService.id, targetId: marketDataFeed.id, type: "GRPC", label: "Market Data Subscribe" },
      { sourceId: complianceService.id, targetId: auditTrail.id, type: "GRPC", label: "Audit Logging" },
      { sourceId: algoTrading.id, targetId: quoteService.id, type: "GRPC", label: "Streaming Quotes" },
      // KAFKA_TOPIC
      { sourceId: tradingEngine.id, targetId: positionManager.id, type: "KAFKA_TOPIC", label: "trades.executed" },
      { sourceId: tradingEngine.id, targetId: settlementEngine.id, type: "KAFKA_TOPIC", label: "trades.executed" },
      { sourceId: tradingEngine.id, targetId: complianceService.id, type: "KAFKA_TOPIC", label: "trades.executed" },
      { sourceId: marketDataFeed.id, targetId: historicalData.id, type: "KAFKA_TOPIC", label: "market.ticks" },
      { sourceId: marketDataFeed.id, targetId: algoTrading.id, type: "KAFKA_TOPIC", label: "market.ticks" },
      { sourceId: accountService.id, targetId: notificationService.id, type: "KAFKA_TOPIC", label: "accounts.events" },
      { sourceId: accountService.id, targetId: complianceService.id, type: "KAFKA_TOPIC", label: "accounts.events" },
      { sourceId: settlementEngine.id, targetId: notificationService.id, type: "KAFKA_TOPIC", label: "settlement.completed" },
      { sourceId: settlementEngine.id, targetId: transferService.id, type: "KAFKA_TOPIC", label: "settlement.completed" },
      { sourceId: kycService.id, targetId: accountService.id, type: "KAFKA_TOPIC", label: "kyc.verified" },
      { sourceId: oms.id, targetId: notificationService.id, type: "KAFKA_TOPIC", label: "orders.submitted" },
      { sourceId: riskEngine.id, targetId: notificationService.id, type: "KAFKA_TOPIC", label: "risk.alerts" },
      { sourceId: riskEngine.id, targetId: complianceService.id, type: "KAFKA_TOPIC", label: "risk.alerts" },
      // SHARED_DATABASE
      { sourceId: settlementEngine.id, targetId: custodyService.id, type: "SHARED_DATABASE", label: "settlement_db" },
      // SHARED_PACKAGE
      { sourceId: oms.id, targetId: accountService.id, type: "SHARED_PACKAGE", label: "company-auth-sdk" },
      { sourceId: oms.id, targetId: apiGateway.id, type: "SHARED_PACKAGE", label: "company-auth-sdk" },
      { sourceId: oms.id, targetId: settlementEngine.id, type: "SHARED_PACKAGE", label: "company-auth-sdk" },
      { sourceId: oms.id, targetId: riskEngine.id, type: "SHARED_PACKAGE", label: "company-auth-sdk" },
      { sourceId: oms.id, targetId: notificationService.id, type: "SHARED_PACKAGE", label: "company-auth-sdk" },
      { sourceId: oms.id, targetId: tradingEngine.id, type: "SHARED_PACKAGE", label: "company-logging-lib" },
      { sourceId: oms.id, targetId: positionManager.id, type: "SHARED_PACKAGE", label: "company-logging-lib" },
      { sourceId: oms.id, targetId: settlementEngine.id, type: "SHARED_PACKAGE", label: "company-logging-lib" },
    ],
  });

  // ══════════════════════════════════════════════════════
  //  INVENTORY UPLOAD + GRAPH SNAPSHOT
  // ══════════════════════════════════════════════════════

  console.log("Creating inventory upload and graph snapshot...");

  const upload = await prisma.inventoryUpload.create({
    data: {
      filename: "corretora-inventory-2026-02.json",
      status: "COMPLETED",
      systemsCount: 20,
      workspaceId: workspace.id,
      rawPayload: {
        systems: [
          "oms", "trading-engine", "position-manager", "algo-trading",
          "customer-portal", "mobile-bff", "kyc-service", "account-service",
          "market-data-feed", "quote-service", "historical-data",
          "settlement-engine", "custody-service", "transfer-service",
          "risk-engine", "compliance-service", "audit-trail",
          "api-gateway", "auth-service", "notification-service",
        ],
      },
      processedAt: new Date(),
    },
  });

  // Build graph data for snapshot
  const { buildGraphData } = await import("../src/modules/graph/services/build-graph-data");

  const allSystems = await prisma.system.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      language: true,
      framework: true,
      layer: true,
      domain: { select: { name: true } },
      _count: { select: { services: true, risks: true } },
    },
  });

  const allDeps = await prisma.dependency.findMany({
    select: { id: true, sourceId: true, targetId: true, type: true, label: true },
  });

  const graphData = buildGraphData(allSystems, allDeps);

  await prisma.graphSnapshot.create({
    data: {
      uploadId: upload.id,
      nodesJson: graphData.nodes as unknown as object[],
      edgesJson: graphData.edges as unknown as object[],
      systemCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
    },
  });

  // ── Summary ─────────────────────────────────────────

  const counts = await Promise.all([
    prisma.domain.count(),
    prisma.system.count(),
    prisma.service.count(),
    prisma.database.count(),
    prisma.dependency.count(),
    prisma.risk.count(),
    prisma.apiEndpoint.count(),
    prisma.messageTopic.count(),
    prisma.package.count(),
  ]);

  console.log("\nSeed completed successfully!");
  console.log(`  Domains:        ${counts[0]}`);
  console.log(`  Systems:        ${counts[1]}`);
  console.log(`  Services:       ${counts[2]}`);
  console.log(`  Databases:      ${counts[3]}`);
  console.log(`  Dependencies:   ${counts[4]}`);
  console.log(`  Risks:          ${counts[5]}`);
  console.log(`  API Endpoints:  ${counts[6]}`);
  console.log(`  Message Topics: ${counts[7]}`);
  console.log(`  Packages:       ${counts[8]}`);
  console.log(`  Snapshot:       1 (for Time Machine)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
