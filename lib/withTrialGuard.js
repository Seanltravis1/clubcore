// lib/withTrialGuard.js
import { trialGuard } from '@/lib/trialGuard'

export function withTrialGuard(getServerSidePropsFunc) {
  return async (ctx) => {
    // ✅ Ensure ctx includes req/res before passing to trialGuard
    if (!ctx?.req || !ctx?.res) {
      console.warn('[withTrialGuard] Missing req/res in ctx')
      return {
        redirect: {
          destination: '/login',
          permanent: false
        }
      }
    }

    const trialValid = await trialGuard(ctx)
    if (!trialValid) {
      return {
        redirect: {
          destination: '/checkout',
          permanent: false
        }
      }
    }

    return await getServerSidePropsFunc(ctx)
  }
}
