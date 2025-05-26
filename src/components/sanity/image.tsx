import { SanityImage, urlFor } from '@/libs/sanity/image'
import Image from 'next/image'

interface SanityImageComponentProps {
    image: SanityImage
    alt?: string
    width?: number
    height?: number
    className?: string
    priority?: boolean
    sizes?: string
}

export function SanityImageComponent({
    image,
    alt,
    width = 800,
    height = 600,
    className = "",
    priority = false,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
}: SanityImageComponentProps) {
    if (!image?.asset) {
        return <div className="bg-gray-200 flex items-center justify-center">No image</div>
    }

    const imageUrl = urlFor(image).auto("format").url()

    return (
        <Image
            src={imageUrl}
            alt={alt || image.alt || ''}
            width={width}
            height={height}
            className={className}
            priority={priority}
            sizes={sizes}
        />
    )
}