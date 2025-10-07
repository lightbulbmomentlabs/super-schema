import { useEffect, useRef } from 'react'

interface LiquidEtherProps {
  className?: string
  color1?: string
  color2?: string
  color3?: string
  speed?: number
}

export default function LiquidEther({
  className = '',
  color1 = '#8B5CF6', // purple-500
  color2 = '#EC4899', // pink-500
  color3 = '#3B82F6', // blue-500
  speed = 0.0005
}: LiquidEtherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation variables
    let time = 0
    const blobs: Array<{
      x: number
      y: number
      radius: number
      vx: number
      vy: number
      color: string
    }> = []

    // Create blobs
    const createBlobs = () => {
      const colors = [color1, color2, color3]
      for (let i = 0; i < 5; i++) {
        blobs.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 200 + 100,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: colors[i % colors.length]
        })
      }
    }
    createBlobs()

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)')
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.05)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw blobs
      blobs.forEach((blob, index) => {
        // Update position
        blob.x += blob.vx + Math.sin(time * speed + index) * 0.5
        blob.y += blob.vy + Math.cos(time * speed + index) * 0.5

        // Bounce off edges
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius
        if (blob.y < -blob.radius) blob.y = canvas.height + blob.radius
        if (blob.y > canvas.height + blob.radius) blob.y = -blob.radius

        // Create radial gradient for blob
        const blobGradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        )

        blobGradient.addColorStop(0, `${blob.color}40`)
        blobGradient.addColorStop(0.5, `${blob.color}20`)
        blobGradient.addColorStop(1, `${blob.color}00`)

        // Draw blob
        ctx.fillStyle = blobGradient
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      time++
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [color1, color2, color3, speed])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        filter: 'blur(60px)',
        zIndex: 0
      }}
    />
  )
}
