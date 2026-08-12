import { ProductGallery } from '@/components/products/product-gallery';
import { ProductPrice } from '@/components/products/product-price';
import { ProductPurchasePanel } from '@/components/products/product-purchase-panel';
import { ProductRating } from '@/components/products/product-rating';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Product } from '@/types';

/**
 * Product detail layout.
 *
 * A Server Component that composes the gallery, the copy and the one interactive
 * island. Everything below the fold — details, ingredients, how to use — is static
 * markup inside an accordion, which is also good for how this content gets indexed.
 */
export function ProductDetails({ product }: { product: Product }) {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <ProductGallery
        images={product.images}
        productName={product.name}
        category={product.category}
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.6875rem] font-medium tracking-[0.16em] text-champagne-500 uppercase">
              {product.brand}
            </p>
            {product.newArrival && <Badge variant="accent">New in</Badge>}
            {product.bestseller && <Badge variant="outline">Bestseller</Badge>}
          </div>

          <h1 className="font-serif text-3xl leading-tight font-light text-foreground sm:text-4xl">
            {product.name}
          </h1>

          <p className="text-base leading-relaxed text-muted-foreground">{product.tagline}</p>

          {product.rating && (
            <ProductRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-3">
          <ProductPrice
            price={product.price}
            salePrice={product.salePrice}
            size="lg"
            showPercent
          />
          {product.size && (
            <span className="text-sm text-muted-foreground">{product.size}</span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">{product.description}</p>

        <ProductPurchasePanel product={product} />

        {product.benefits && product.benefits.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {product.benefits.map((benefit) => (
              <li key={benefit}>
                <Badge variant="soft">{benefit}</Badge>
              </li>
            ))}
          </ul>
        )}

        <Accordion type="multiple" defaultValue={['details']} className="border-t border-border">
          <AccordionItem value="details">
            <AccordionTrigger>The detail</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 leading-relaxed">
                {product.details.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {product.howToUse && (
            <AccordionItem value="how-to-use">
              <AccordionTrigger>How to use</AccordionTrigger>
              <AccordionContent>
                <p className="leading-relaxed">{product.howToUse}</p>
              </AccordionContent>
            </AccordionItem>
          )}

          {product.ingredients && product.ingredients.length > 0 && (
            <AccordionItem value="ingredients">
              <AccordionTrigger>Key ingredients</AccordionTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-2">
                  {product.ingredients.map((ingredient) => (
                    <li key={ingredient} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-1 shrink-0 rounded-full bg-champagne-400"
                      />
                      {ingredient}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground/80">
                  Full INCI list is printed on the carton. If you are pregnant or treating a skin
                  condition, check with your doctor before introducing an active.
                </p>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="delivery">
            <AccordionTrigger>Delivery &amp; returns</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 leading-relaxed">
                <p>
                  Standard delivery takes 2–4 working days across Kosovo and is free on orders over
                  €50. Express delivery arrives the next working day.
                </p>
                <p>
                  Unopened products can be returned within 14 days. For hygiene reasons we cannot
                  accept opened cosmetics — if something is wrong with your order, contact us and we
                  will put it right.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
