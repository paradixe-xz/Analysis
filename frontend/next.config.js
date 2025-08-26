/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Remover la configuración de NEXT_PUBLIC_API_URL ya que usaremos rutas API internas
  },
}

module.exports = nextConfig