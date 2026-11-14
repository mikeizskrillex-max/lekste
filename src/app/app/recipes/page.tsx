'use client';

import { Suspense } from 'react';
import { CatalogPage } from '@/components/catalog';

export default function Page() { return <Suspense><CatalogPage inApp /></Suspense>; }
