import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  rainbowWallet,
  metaMaskWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, base } from 'wagmi/chains';
import { http } from 'viem';
import { SiweMessage } from 'siwe';

export interface WalletSetupOptions {
  appName: string;
  projectId: string;
}

export function createRainbowWagmiConfig(options: WalletSetupOptions) {
  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Popular',
        wallets: [injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet],
      },
    ],
    {
      appName: options.appName,
      projectId: options.projectId,
    },
  );

  return createConfig({
    connectors,
    chains: [mainnet, arbitrum, polygon, base],
    transports: {
      [mainnet.id]: http(),
      [arbitrum.id]: http(),
      [polygon.id]: http(),
      [base.id]: http(),
    },
    ssr: true,
  });
}

export function createSiweMessage(params: {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
}) {
  return new SiweMessage(params);
}
