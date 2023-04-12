import React from 'react';
import { Skeleton } from './Skeleton';

export const FormSkeleton = () => (
  <Skeleton className="h-full w-[120vh]">
    <rect height="3" rx="2" ry="2" width="22" x="9" y="6" />
    <rect height="5" rx="2" ry="2" width="41" x="33" y="5" />
    <rect height="3" rx="2" ry="2" width="22" x="107" y="6" />
    <rect height="5" rx="2" ry="2" width="25" x="131" y="5" />
    <rect height="5" rx="2" ry="2" width="25" x="157" y="5" />

    <rect height="5" rx="2" ry="2" width="52" x="9" y="18" />
    <circle cx="66" cy="20.5" r="3" />
    <circle cx="74" cy="20.5" r="3" />
    <rect height="3" rx="2" ry="2" width="22" x="9" y="25" />

    <rect height="3" rx="2" ry="2" width="22" x="28" y="35" />
    <rect height="5" rx="2" ry="2" width="100" x="54" y="34" />
    <circle cx="158" cy="36.5" r="2" />
    <circle cx="163" cy="36.5" r="2" />
    <circle cx="168" cy="36.5" r="2" />

    <rect height="5" rx="2" ry="2" width="52" x="9" y="53" />
    <circle cx="66" cy="55.5" r="3" />
    <rect height="3" rx="2" ry="2" width="22" x="9" y="60" />

    <rect height="20" rx="2" ry="2" width="96" x="86" y="47.5" />

    <rect height="5" rx="2" ry="2" width="52" x="9" y="73" />
    <circle cx="66" cy="75.5" r="3" />

    <rect height="3" rx="2" ry="2" width="22" x="9" y="93" />
    <rect height="7" rx="2" ry="2" width="25" x="9" y="98" />
    <rect height="7" rx="2" ry="2" width="25" x="40" y="98" />
    <rect height="7" rx="2" ry="2" width="25" x="125" y="98" />

    <rect height="5" rx="2" ry="2" width="130" x="9" y="120" />
  </Skeleton>
);
