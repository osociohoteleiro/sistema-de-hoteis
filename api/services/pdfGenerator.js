const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generateReportPDF(reportData, hotelData) {
    try {
      console.log('PDFGenerator: Iniciando geração de PDF');
      await this.init();
      console.log('PDFGenerator: Browser inicializado');
      
      // Carregar template
      const templatePath = path.join(__dirname, '../templates/report.hbs');
      const templateSource = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      
      // Preparar dados para o template
      const templateData = this.prepareTemplateData(reportData, hotelData);
      
      // Gerar HTML
      const html = template(templateData);
      
      // Criar página e gerar PDF
      const page = await this.browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Configurações do PDF
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            Relatório de Marketing - ${hotelData.hotel_nome}
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; display: flex; justify-content: space-between; color: #666; padding: 0 20mm;">
            <span>Gerado em ${moment().format('DD/MM/YYYY HH:mm')}</span>
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `
      };
      
      const pdf = await page.pdf(pdfOptions);
      await page.close();
      
      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }

  prepareTemplateData(reportData, hotelData) {
    const { meta_data, summary_metrics, report_name, created_at } = reportData;
    
    // Calcular insights e recomendações
    const insights = this.generateInsights(meta_data, summary_metrics);
    const recommendations = this.generateRecommendations(meta_data, summary_metrics);
    
    // Top 5 campanhas por custo
    const topCampaigns = meta_data.campaigns.slice(0, 5);
    
    // Top 5 campanhas por CTR
    const topCTRCampaigns = [...meta_data.campaigns]
      .sort((a, b) => parseFloat(b.ctr) - parseFloat(a.ctr))
      .slice(0, 5);
    
    // Top 5 campanhas por conversão
    const topConversionCampaigns = [...meta_data.campaigns]
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5);
    
    return {
      // Dados do hotel
      hotel: {
        name: hotelData.hotel_nome,
        logo: hotelData.hotel_capa || null
      },
      
      // Dados do relatório
      report: {
        name: report_name,
        period: {
          start: reportData.report_period_start ? moment(reportData.report_period_start).format('DD/MM/YYYY') : null,
          end: reportData.report_period_end ? moment(reportData.report_period_end).format('DD/MM/YYYY') : null
        },
        generated_at: moment(created_at).format('DD/MM/YYYY HH:mm'),
        generated_date: moment().format('DD/MM/YYYY HH:mm')
      },
      
      // Métricas principais
      summary: {
        totalImpressions: this.formatNumber(summary_metrics.totalImpressions),
        totalClicks: this.formatNumber(summary_metrics.totalClicks),
        totalConversions: this.formatNumber(summary_metrics.totalConversions),
        totalCost: this.formatCurrency(summary_metrics.totalCost),
        averageCTR: summary_metrics.averageCTR + '%',
        averageCPC: this.formatCurrency(summary_metrics.averageCPC),
        averageCPM: this.formatCurrency(summary_metrics.averageCPM),
        totalCampaigns: summary_metrics.totalCampaigns
      },
      
      // Rankings de campanhas
      campaigns: {
        top_by_cost: topCampaigns.map(c => ({
          ...c,
          cost: this.formatCurrency(c.cost),
          impressions: this.formatNumber(c.impressions),
          clicks: this.formatNumber(c.clicks),
          conversions: this.formatNumber(c.conversions),
          ctr: c.ctr + '%',
          cpc: this.formatCurrency(c.cpc)
        })),
        top_by_ctr: topCTRCampaigns.map(c => ({
          ...c,
          cost: this.formatCurrency(c.cost),
          impressions: this.formatNumber(c.impressions),
          clicks: this.formatNumber(c.clicks),
          conversions: this.formatNumber(c.conversions),
          ctr: c.ctr + '%',
          cpc: this.formatCurrency(c.cpc)
        })),
        top_by_conversion: topConversionCampaigns.map(c => ({
          ...c,
          cost: this.formatCurrency(c.cost),
          impressions: this.formatNumber(c.impressions),
          clicks: this.formatNumber(c.clicks),
          conversions: this.formatNumber(c.conversions),
          ctr: c.ctr + '%',
          cpc: this.formatCurrency(c.cpc)
        }))
      },
      
      // Análises e insights
      insights,
      recommendations,
      
      // Dados para gráficos (top 10 campanhas)
      chartData: {
        campaigns: meta_data.campaigns.slice(0, 10).map(c => ({
          name: c.name.length > 30 ? c.name.substring(0, 27) + '...' : c.name,
          cost: c.cost,
          clicks: c.clicks,
          conversions: c.conversions,
          impressions: c.impressions
        }))
      }
    };
  }

  generateInsights(metaData, summaryMetrics) {
    const insights = [];
    const { campaigns } = metaData;
    const { totalCost, averageCTR, averageCPC } = summaryMetrics;
    
    // Insight sobre performance geral
    const avgCTR = parseFloat(averageCTR);
    if (avgCTR > 2.0) {
      insights.push({
        type: 'positive',
        title: 'CTR Acima da Média',
        description: `Sua taxa de cliques média de ${averageCTR}% está acima da média do mercado (1-2%), indicando boa relevância dos anúncios.`
      });
    } else if (avgCTR < 1.0) {
      insights.push({
        type: 'warning',
        title: 'CTR Abaixo da Média',
        description: `Sua taxa de cliques média de ${averageCTR}% está abaixo da média do mercado. Considere revisar criativos e segmentação.`
      });
    }
    
    // Insight sobre distribuição de orçamento
    const top3Cost = campaigns.slice(0, 3).reduce((sum, c) => sum + c.cost, 0);
    const concentrationPercentage = ((top3Cost / totalCost) * 100).toFixed(1);
    
    if (concentrationPercentage > 70) {
      insights.push({
        type: 'info',
        title: 'Alta Concentração de Orçamento',
        description: `${concentrationPercentage}% do orçamento está concentrado em apenas 3 campanhas. Considere diversificar para reduzir riscos.`
      });
    }
    
    // Insight sobre campanhas com melhor ROI
    const bestROICampaign = campaigns.find(c => c.conversions > 0 && c.cost > 0);
    if (bestROICampaign) {
      const roi = ((bestROICampaign.conversions * 100) / bestROICampaign.cost).toFixed(2);
      insights.push({
        type: 'positive',
        title: 'Campanha de Destaque',
        description: `"${bestROICampaign.name}" apresenta excelente performance com ${bestROICampaign.conversions} conversões.`
      });
    }
    
    return insights;
  }

  generateRecommendations(metaData, summaryMetrics) {
    const recommendations = [];
    const { campaigns } = metaData;
    const { averageCTR, averageCPC } = summaryMetrics;
    
    // Recomendações baseadas em CTR baixo
    const lowCTRCampaigns = campaigns.filter(c => parseFloat(c.ctr) < 1.0).length;
    if (lowCTRCampaigns > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Otimizar Campanhas com CTR Baixo',
        description: `${lowCTRCampaigns} campanhas com CTR abaixo de 1%. Teste novos criativos, revise audiências e palavras-chave.`,
        action: 'Revisar criativos e segmentação'
      });
    }
    
    // Recomendações sobre orçamento
    const expensiveCampaigns = campaigns.filter(c => parseFloat(c.cpc) > 5.0).length;
    if (expensiveCampaigns > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Reduzir CPC Alto',
        description: `${expensiveCampaigns} campanhas com CPC alto. Considere refinar a segmentação para reduzir custos.`,
        action: 'Otimizar lance e segmentação'
      });
    }
    
    // Recomendação para campanhas sem conversões
    const noConversionCampaigns = campaigns.filter(c => c.conversions === 0 && c.cost > 50).length;
    if (noConversionCampaigns > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Campanhas Sem Conversões',
        description: `${noConversionCampaigns} campanhas gastaram mais de R$ 50 sem gerar conversões. Considere pausar ou reavaliar.`,
        action: 'Pausar ou reconfigurar campanhas'
      });
    }
    
    // Recomendação geral
    recommendations.push({
      priority: 'low',
      title: 'Monitoramento Contínuo',
      description: 'Continue monitorando as métricas diariamente e ajuste as campanhas conforme necessário.',
      action: 'Implementar rotina de análise'
    });
    
    return recommendations;
  }

  formatNumber(number) {
    return new Intl.NumberFormat('pt-BR').format(number);
  }

  formatCurrency(number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  }
}

// Singleton instance
const pdfGenerator = new PDFGenerator();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pdfGenerator.close();
});

process.on('SIGINT', async () => {
  await pdfGenerator.close();
});

module.exports = pdfGenerator;