import { HomeContainer, Product } from '@/styles/pages/home'
import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'

import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'

import { GetStaticProps } from 'next'
import { stripe } from '../lib/stripe'
import Stripe from 'stripe'
import { CartButton } from '@/components/CartButton'
import { useCart } from '../hooks/useCart'
import { IProduct } from '@/contexts/CartContext'
import { MouseEvent, useEffect, useState } from 'react'
import { ProductSkeleton } from '@/components/ProductSkeleton'

interface HomeProps {
  products: IProduct[]
}

export default function Home({ products }: HomeProps) {
  const { addToCart, checkIfItemAlreadyExists } = useCart()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // fake loading to use the skeleton loading from figma
    const timeOut = setTimeout(() => setIsLoading(false), 2000)

    return () => clearTimeout(timeOut)
  }, [])

  const [sliderRef] = useKeenSlider({
    slides: {
      perView: 'auto',
      spacing: 48,
    },
  })

  function handleAddToCart(
    e: MouseEvent<HTMLButtonElement>,
    product: IProduct,
  ) {
    e.preventDefault()
    addToCart(product)
  }

  return (
    <>
      <Head>
        <title> Home | Ignite Shop</title>
      </Head>

      <HomeContainer ref={sliderRef} className="keen-slider">
        {isLoading ? (
          <>
            <ProductSkeleton className="keen-slider__slide" />
            <ProductSkeleton className="keen-slider__slide" />
            <ProductSkeleton className="keen-slider__slide" />
          </>
        ) : (
          <>
            {products.map((product) => {
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  prefetch={false}
                >
                  <Product
                    className="keen-slider__slide"
                    style={{ minWidth: 696 }}
                  >
                    <Image
                      src={product.imageUrl}
                      alt=""
                      width={520}
                      height={480}
                    />

                    <footer>
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.price}</span>
                      </div>
                      <CartButton
                        color="green"
                        size="large"
                        disabled={checkIfItemAlreadyExists(product.id)}
                        onClick={(e) => handleAddToCart(e, product)}
                      />
                    </footer>
                  </Product>
                </Link>
              )
            })}
          </>
        )}
      </HomeContainer>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const response = await stripe.products.list({
    expand: ['data.default_price'],
  })

  const products = response.data.map((product) => {
    const price = product.default_price as Stripe.Price

    return {
      id: product.id,
      name: product.name,
      imageUrl: product.images[0],
      price: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format((price.unit_amount || 0) / 100),
      numberPrice: price.unit_amount / 100,
      defaultPriceId: price.id,
    }
  })

  return {
    props: {
      products,
    },
    revalidate: 60 * 60 * 2, // 2 horas
  }
}
