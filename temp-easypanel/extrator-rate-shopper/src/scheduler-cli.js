#!/usr/bin/env node

const { program } = require('commander');
const { getScheduler, runAsMainProcess } = require('./scheduler');
const { logger } = require('./logger');

program
  .name('rate-shopper-scheduler')
  .description('Rate Shopper Scheduling System CLI')
  .version('1.0.0');

program
  .command('start')
  .description('Start the scheduler daemon')
  .action(async () => {
    try {
      console.log('🚀 Starting Rate Shopper Scheduler...');
      await runAsMainProcess();
    } catch (error) {
      console.error('❌ Failed to start scheduler:', error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show scheduler status')
  .action(async () => {
    try {
      const scheduler = getScheduler();
      const status = scheduler.getStatus();
      
      console.log('\n📊 Rate Shopper Scheduler Status:');
      console.log(`Running: ${status.isRunning ? '✅' : '❌'}`);
      console.log(`Process ID: ${status.pid}`);
      console.log(`Uptime: ${Math.round(status.uptime)}s`);
      console.log(`Scheduled Tasks: ${status.scheduledTasks.length}`);
      
      if (status.scheduledTasks.length > 0) {
        console.log('\n📅 Active Schedules:');
        status.scheduledTasks.forEach(taskName => {
          console.log(`  - ${taskName}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      process.exit(1);
    }
  });

program
  .command('run-now')
  .description('Execute extraction immediately')
  .action(async () => {
    try {
      console.log('🏃 Running manual extraction...');
      const scheduler = getScheduler();
      await scheduler.executeManualExtraction();
      console.log('✅ Manual extraction completed');
    } catch (error) {
      console.error('❌ Manual extraction failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Show current scheduler configuration')
  .action(async () => {
    try {
      const path = require('path');
      const fs = require('fs').promises;
      
      const configPath = path.join(process.cwd(), 'src', 'scheduler-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      console.log('\n⚙️  Scheduler Configuration:');
      console.log(`Enabled: ${config.enabled ? '✅' : '❌'}`);
      console.log(`Timezone: ${config.timezone}`);
      console.log(`Schedules: ${config.schedules.length}`);
      
      console.log('\n📅 Configured Schedules:');
      config.schedules.forEach(schedule => {
        console.log(`\n  📋 ${schedule.name}`);
        console.log(`     Enabled: ${schedule.enabled ? '✅' : '❌'}`);
        console.log(`     Cron: ${schedule.cron}`);
        console.log(`     Description: ${schedule.description}`);
        console.log(`     Properties: ${schedule.properties}`);
      });
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('⚠️  No configuration file found. Run scheduler once to create default config.');
      } else {
        console.error('❌ Failed to read config:', error.message);
        process.exit(1);
      }
    }
  });

program
  .command('logs')
  .description('Show recent scheduler logs')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action(async (options) => {
    try {
      const path = require('path');
      const fs = require('fs').promises;
      
      const logsDir = path.join(process.cwd(), 'logs');
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter(file => file.includes('rate-shopper') && file.endsWith('.log'));
      
      if (logFiles.length === 0) {
        console.log('📝 No log files found');
        return;
      }
      
      // Pegar o arquivo de log mais recente
      const latestLogFile = logFiles.sort().reverse()[0];
      const logPath = path.join(logsDir, latestLogFile);
      
      console.log(`📋 Latest logs from: ${latestLogFile}\n`);
      
      const logContent = await fs.readFile(logPath, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      const recentLines = lines.slice(-parseInt(options.lines));
      
      recentLines.forEach(line => {
        try {
          const logEntry = JSON.parse(line);
          const timestamp = new Date(logEntry.timestamp).toLocaleString();
          console.log(`${timestamp} [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
          
          if (logEntry.event) {
            console.log(`  Event: ${logEntry.event}`);
          }
          
          if (logEntry.error) {
            console.log(`  Error: ${logEntry.error}`);
          }
        } catch {
          console.log(line);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to read logs:', error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}