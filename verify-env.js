// Script to verify environment variables are loaded correctly
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Verifying environment variables...\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const huggingfaceKey = process.env.HUGGINGFACE_API_KEY

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
if (supabaseUrl) {
  console.log('  Value:', supabaseUrl.substring(0, 30) + '...')
}

console.log('\nNEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
if (supabaseKey) {
  console.log('  Value:', supabaseKey.substring(0, 20) + '...')
  console.log('  Length:', supabaseKey.length)
}

console.log('\nHUGGINGFACE_API_KEY:', huggingfaceKey ? '✅ Set' : '❌ Missing')
if (huggingfaceKey) {
  console.log('  Value:', huggingfaceKey.substring(0, 10) + '...')
}

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing required Supabase environment variables!')
  console.log('   Make sure .env.local exists and has the correct values.')
  process.exit(1)
}

console.log('\n✅ All required environment variables are set!')
