export const SCHEMA_TYPES = [
  { value: 'Auto', label: 'Auto-Detect', description: 'AI automatically determines the best schema type(s) for your content' },
  { value: 'Article', label: 'Article', description: 'Blog posts, news articles, and editorial content' },
  { value: 'BlogPosting', label: 'Blog Post', description: 'Specific type of article for blog content' },
  { value: 'NewsArticle', label: 'News Article', description: 'News stories and press releases' },
  { value: 'FAQPage', label: 'FAQ Page', description: 'Frequently asked questions and answers' },
  { value: 'HowTo', label: 'How-To Guide', description: 'Step-by-step instructional content' },
  { value: 'LocalBusiness', label: 'Local Business', description: 'Physical business location information' },
  { value: 'Organization', label: 'Organization', description: 'Company, brand, or organization details' },
  { value: 'Product', label: 'Product', description: 'Product listings with price and availability' },
  { value: 'QAPage', label: 'Q&A Page', description: 'Single question and answer pairs' },
  { value: 'Review', label: 'Review', description: 'Customer reviews and ratings' },
  { value: 'WebPage', label: 'Web Page', description: 'Basic page structure and metadata' },
  { value: 'BreadcrumbList', label: 'Breadcrumbs', description: 'Site navigation breadcrumbs' },
  { value: 'ImageObject', label: 'Images', description: 'Featured images and media' },
  { value: 'VideoObject', label: 'Videos', description: 'Video content and metadata' }
] as const

export type SchemaTypeValue = typeof SCHEMA_TYPES[number]['value']
