import React from 'react';
import { QueryProvider } from '@/components/QueryProvider';
import LastListView from './LastListView';

export const LastListFeature = () => {
  return (
    <QueryProvider>
      <LastListView />
    </QueryProvider>
  );
};

export default LastListFeature;
