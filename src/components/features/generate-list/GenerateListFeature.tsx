import React from 'react';
import { QueryProvider } from '@/components/QueryProvider';
import { GenerateListView } from './GenerateListView';

export const GenerateListFeature = () => {
  return (
    <QueryProvider>
      <GenerateListView />
    </QueryProvider>
  );
};
