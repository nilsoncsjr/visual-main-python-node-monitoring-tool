// Script to test individual SQL Server connection
const sql = require('mssql');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to parse connection string
function parseConnectionString(connectionString) {
  const config = {
    user: '',
    password: '',
    server: '',
    database: 'master',
    port: 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };

  if (!connectionString) {
    return null;
  }

  // Parse URL format: mssql+pyodbc://user:pass@server:port/database?params
  if (connectionString.startsWith('mssql')) {
    const [mainPart, queryPart] = connectionString.split('?');
    const urlMatch = mainPart.match(/mssql\+?[^:]*:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?(?:\/(.+))?/);
    
    if (urlMatch) {
      config.user = urlMatch[1] || '';
      config.password = urlMatch[2] || '';
      config.server = urlMatch[3] || '';
      config.port = parseInt(urlMatch[4] || '1433');
      config.database = urlMatch[5] || 'master';
    }
    
    // Parse query parameters
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      
      if (params.get('Encrypt')) {
        config.options.encrypt = params.get('Encrypt').toLowerCase() === 'yes';
      }
      
      if (params.get('TrustServerCertificate')) {
        config.options.trustServerCertificate = params.get('TrustServerCertificate').toLowerCase() === 'yes';
      }
    }
    
    return config;
  }

  // Parse traditional format: Server=...;Database=...;User Id=...;Password=...;
  const parts = connectionString.split(';');
  
  parts.forEach(part => {
    const [key, value] = part.split('=').map(s => s.trim());
    
    switch(key.toLowerCase()) {
      case 'server':
      case 'data source':
        const serverParts = value.split(',');
        config.server = serverParts[0];
        if (serverParts[1]) {
          config.port = parseInt(serverParts[1]);
        }
        break;
      case 'database':
      case 'initial catalog':
        config.database = value;
        break;
      case 'user id':
      case 'uid':
      case 'user':
        config.user = value;
        break;
      case 'password':
      case 'pwd':
        config.password = value;
        break;
      case 'encrypt':
        config.options.encrypt = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
        break;
      case 'trustservercertificate':
        config.options.trustServerCertificate = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
        break;
    }
  });

  return config;
}

// Test connection
async function testConnection(serverNumber) {
  const connectionString = process.env[`SQL_SERVER_${serverNumber}_CONNECTION`];
  const serverName = process.env[`SQL_SERVER_${serverNumber}_NAME`] || `Server ${serverNumber}`;
  
  if (!connectionString) {
    console.log(`❌ SQL_SERVER_${serverNumber}_CONNECTION not configured`);
    return false;
  }

  console.log(`\n📊 Testing: ${serverName}`);
  console.log(`Connection string: ${connectionString.substring(0, 50)}...`);
  
  const config = parseConnectionString(connectionString);
  
  if (!config) {
    console.log('❌ Error parsing connection string');
    return false;
  }

  console.log(`Server: ${config.server}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  console.log(`Encrypt: ${config.options.encrypt}`);
  console.log(`TrustServerCertificate: ${config.options.trustServerCertificate}`);
  
  try {
    console.log('🔄 Connecting...');
    const pool = await sql.connect(config);
    
    console.log('✅ Connected successfully!');
    
    // Test simple query
    const result = await pool.request().query('SELECT @@VERSION as version, @@SERVERNAME as serverName');
    console.log(`Server: ${result.recordset[0].serverName}`);
    console.log(`Version: ${result.recordset[0].version.substring(0, 100)}...`);
    
    // Test metrics queries
    console.log('\n📊 Testing metrics queries:');
    
    // Active sessions
    const sessions = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM sys.dm_exec_sessions 
      WHERE is_user_process = 1 AND status = 'running'
    `);
    console.log(`  ✓ Active sessions: ${sessions.recordset[0].count}`);
    
    // CPU Usage
    try {
      const cpu = await pool.request().query(`
        SELECT TOP 1 
          SQLProcessUtilization as sql_cpu,
          100 - SystemIdle - SQLProcessUtilization as other_cpu
        FROM (
          SELECT 
            record.value('(./Record/@id)[1]', 'int') as record_id,
            record.value('(./Record/SchedulerMonitorEvent/SystemHealth/SystemIdle)[1]', 'int') as SystemIdle,
            record.value('(./Record/SchedulerMonitorEvent/SystemHealth/ProcessUtilization)[1]', 'int') as SQLProcessUtilization
          FROM (
            SELECT CAST(record as xml) as record 
            FROM sys.dm_os_ring_buffers 
            WHERE ring_buffer_type = N'RING_BUFFER_SCHEDULER_MONITOR'
            AND record LIKE '%<SystemHealth>%'
          ) AS x
        ) AS y 
        ORDER BY record_id DESC
      `);
      console.log(`  ✓ SQL Server CPU: ${cpu.recordset[0]?.sql_cpu || 0}%`);
    } catch (err) {
      console.log('  ⚠ CPU query not supported on this version');
    }
    
    await pool.close();
    console.log('\n✅ All tests passed!');
    return true;
    
  } catch (err) {
    console.log(`\n❌ Connection error: ${err.message}`);
    console.log('\nPossible solutions:');
    console.log('1. Check if SQL Server is running');
    console.log('2. Check if username/password are correct');
    console.log('3. Check if server accepts remote connections');
    console.log('4. Check if firewall allows port 1433');
    console.log('5. Check if SQL Server Authentication is enabled');
    return false;
  }
}

// Main
async function main() {
  console.log('====================================');
  console.log('   SQL Server Connection Tester    ');
  console.log('====================================');
  
  // Test which server (or all)
  const serverNumber = process.argv[2];
  
  if (serverNumber) {
    // Test specific server
    await testConnection(serverNumber);
  } else {
    // Test all configured servers
    console.log('\nTesting all configured servers...\n');
    
    for (let i = 1; i <= 6; i++) {
      if (process.env[`SQL_SERVER_${i}_CONNECTION`]) {
        await testConnection(i);
      }
    }
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});