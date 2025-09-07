const fs = require('fs');
const path = require('path');
const nunjucks = require('./vendor/nunjucks.min.js');

const srcDir = path.resolve(__dirname);
const distDir = path.resolve(__dirname, 'dist');

// Configure Nunjucks
nunjucks.configure(path.join(srcDir, 'includes'), {
  autoescape: true,
  noCache: true
});

function renderTemplate(template, context, outputPath) {
  const rendered = nunjucks.render(template, context);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, rendered, 'utf-8');
}

async function generateFaqPage() {
  console.log('Generating FAQ page...');
  const faqData = JSON.parse(fs.readFileSync(path.join(srcDir, 'faq', 'faq.json'), 'utf-8'));
  const header = fs.readFileSync(path.join(srcDir, 'includes', 'header.html'), 'utf-8');
  const footer = fs.readFileSync(path.join(srcDir, 'includes', 'footer.html'), 'utf-8');

  const context = {
    header,
    footer,
    faqs: faqData
  };

  // We need to inject the content into a full page structure.
  // For now, let's create a simple page template here.
  // Later we can move this to a proper layout file.
  const pageLayout = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FAQ - UDLex</title>
      <link rel="stylesheet" href="/style.css">
      <link rel="stylesheet" href="/css/base.css">
      <link rel="stylesheet" href="/css/components.css">
    </head>
    <body>
      {{ header | safe }}
      <main class="container">
        <h1>Frequently Asked Questions</h1>
        <div class="faq-list">
          {% for faq in faqs %}
            <div class="faq-item">
              <h3 class="faq-question">{{ faq.question }}</h3>
              <div class="faq-answer">
                {{ faq.answer | safe }}
              </div>
            </div>
          {% endfor %}
        </div>
      </main>
      {{ footer | safe }}
      <script src="/js/theme.js"></script>
    </body>
    </html>
  `;

  const renderedPage = nunjucks.renderString(pageLayout, context);
  const outputPath = path.join(distDir, 'faq', 'index.html');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, renderedPage, 'utf-8');
  console.log('FAQ page generated.');
}

async function generatePartnersPage() {
  console.log('Generating Partners page...');
  const partnersData = JSON.parse(fs.readFileSync(path.join(srcDir, 'partners', 'partners.json'), 'utf-8'));
  const header = fs.readFileSync(path.join(srcDir, 'includes', 'header.html'), 'utf-8');
  const footer = fs.readFileSync(path.join(srcDir, 'includes', 'footer.html'), 'utf-8');

  const context = {
    header,
    footer,
    partners: partnersData
  };

  const pageLayout = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Partners - UDLex</title>
      <link rel="stylesheet" href="/style.css">
      <link rel="stylesheet" href="/css/base.css">
      <link rel="stylesheet" href="/css/components.css">
      <link rel="stylesheet" href="/css/partners.css">
    </head>
    <body>
      {{ header | safe }}
      <main class="container">
        <h1>Our Partners</h1>
        <div class="partner-list">
          {% for partner in partners %}
            <div class="partner-card">
              <a href="{{ partner.url }}" target="_blank" rel="noopener">
                <img src="{{ partner.logo }}" alt="{{ partner.name }} Logo" class="partner-logo">
                <h3 class="partner-name">{{ partner.name }}</h3>
              </a>
              <p class="partner-description">{{ partner.description }}</p>
            </div>
          {% endfor %}
        </div>
      </main>
      {{ footer | safe }}
      <script src="/js/theme.js"></script>
    </body>
    </html>
  `;

  const renderedPage = nunjucks.renderString(pageLayout, context);
  const outputPath = path.join(distDir, 'partners', 'index.html');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, renderedPage, 'utf-8');
  console.log('Partners page generated.');
}


const layouts = {
  article: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{ title }} - UDLex</title>
      <link rel="stylesheet" href="/style.css">
      <link rel="stylesheet" href="/css/base.css">
      <link rel="stylesheet" href="/css/components.css">
    </head>
    <body>
      {{ header | safe }}
      <main class="container">
        {{ content | safe }}
      </main>
      {{ footer | safe }}
      <script src="/js/theme.js"></script>
    </body>
    </html>
  `
};

function findFiles(dir, ext, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, ext, callback);
    } else if (path.extname(file) === ext) {
      callback(filePath);
    }
  });
}

async function generateArticlePages() {
  console.log('Generating individual article pages...');
  const articlesDir = path.join(srcDir, 'articles', 'categories');
  const header = fs.readFileSync(path.join(srcDir, 'includes', 'header.html'), 'utf-8');
  const footer = fs.readFileSync(path.join(srcDir, 'includes', 'footer.html'), 'utf-8');

  findFiles(articlesDir, '.html', (filePath) => {
    const articleContent = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(srcDir, filePath);
    const outputPath = path.join(distDir, relativePath);

    const titleMatch = articleContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'Article';

    const bodyMatch = articleContent.match(/<body>([\s\S]*)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1] : '';

    // We only want the content inside the <article> tag from the original file
    const articleTagMatch = bodyContent.match(/<article.*>([\s\S]*)<\/article>/);
    const content = articleTagMatch ? articleTagMatch[1] : bodyContent;


    const context = {
      header,
      footer,
      title,
      content
    };

    const renderedPage = nunjucks.renderString(layouts.article, context);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, renderedPage, 'utf-8');
  });
  console.log('Individual article pages generated.');
}

async function generateArticlesListPage() {
  console.log('Generating Articles list page...');
  const articlesData = JSON.parse(fs.readFileSync(path.join(srcDir, 'articles', 'articles.json'), 'utf-8'));
  const header = fs.readFileSync(path.join(srcDir, 'includes', 'header.html'), 'utf-8');
  const footer = fs.readFileSync(path.join(srcDir, 'includes', 'footer.html'), 'utf-8');

  const context = {
    header,
    footer,
    articles: articlesData
  };

  const pageLayout = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Articles - UDLex</title>
      <link rel="stylesheet" href="/style.css">
      <link rel="stylesheet" href="/css/base.css">
      <link rel="stylesheet" href="/css/components.css">
    </head>
    <body>
      {{ header | safe }}
      <main class="container">
        <h1>Articles</h1>
        <div class="article-list">
          {% for article in articles %}
            <div class="article-item">
              <h2><a href="/articles/categories/{{ article.category }}/{{ article.slug }}.html">{{ article.title }}</a></h2>
              <p>{{ article.excerpt }}</p>
              <p class="meta">Published on {{ article.date }}</p>
            </div>
          {% endfor %}
        </div>
      </main>
      {{ footer | safe }}
      <script src="/js/theme.js"></script>
    </body>
    </html>
  `;

  const renderedPage = nunjucks.renderString(pageLayout, context);
  const outputPath = path.join(distDir, 'articles', 'index.html');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, renderedPage, 'utf-8');
  console.log('Articles list page generated.');
}

async function generateHomepage() {
  console.log('Generating homepage...');
  const homepageTemplate = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf-8');
  const header = fs.readFileSync(path.join(srcDir, 'includes', 'header.html'), 'utf-8');
  const footer = fs.readFileSync(path.join(srcDir, 'includes', 'footer.html'), 'utf-8');
  const faqData = JSON.parse(fs.readFileSync(path.join(srcDir, 'faq', 'faq.json'), 'utf-8'));

  const context = {
    header,
    footer,
    faqs: faqData
  };

  const renderedPage = nunjucks.renderString(homepageTemplate, context);
  const outputPath = path.join(distDir, 'index.html');
  fs.writeFileSync(outputPath, renderedPage, 'utf-8');
  console.log('Homepage generated.');
}

function copyStaticAssets() {
  console.log('Copying static assets...');
  const assetDirs = ['css', 'js', 'assets', 'cdn', 'embedprgrm'];
  assetDirs.forEach(dir => {
    const src = path.join(srcDir, dir);
    const dest = path.join(distDir, dir);
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true });
    }
  });

  const rootFiles = ['style.css', 'CNAME', '404.html'];
  rootFiles.forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
  console.log('Static assets copied.');
}

// Main build function
async function build() {
  console.log('Starting build process...');

  try {
    // Ensure the dist directory exists and is clean
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    copyStaticAssets();
    await generateFaqPage();
    await generatePartnersPage();
    await generateArticlePages();
    await generateArticlesListPage();
    await generateHomepage();

    console.log('Build process completed successfully!');
  } catch (error) {
    console.error('Error during build process:', error);
    process.exit(1);
  }
}

// Run the build
build();
