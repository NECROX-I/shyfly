import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, image, noindex }) {
  const t = title ? `${title} | Shyfly` : 'Shyfly — For Every Woman, Every You'
  return (
    <Helmet>
      <title>{t}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={t} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      {noindex && <meta name="robots" content="noindex" />}
    </Helmet>
  )
}
