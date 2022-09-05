import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import {theme} from "../src/chakra/theme"
import Layout from '../src/components/Layout/Layout';
import { RecoilRoot } from 'recoil';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
  <ChakraProvider theme={theme}>
    <Layout>
     <Component {...pageProps} /> 
    </Layout>
  </ChakraProvider>
  </RecoilRoot>
  );
}

export default MyApp
