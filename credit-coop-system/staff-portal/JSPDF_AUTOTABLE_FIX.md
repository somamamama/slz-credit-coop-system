# jsPDF AutoTable Fix

## Problem
The error "doc.autoTable is not a function" occurs when the jsPDF autoTable plugin isn't properly loaded or recognized.

## Common Solutions

### Solution 1: Named Import (For jsPDF 3.x)
```javascript
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
```

### Solution 2: Default Import (For jsPDF 2.x)
```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';
```

### Solution 3: Explicit Plugin Import
```javascript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Use as: autoTable(doc, options)
```

### Solution 4: Dynamic Import
```javascript
import jsPDF from 'jspdf';

const loadAutoTable = async () => {
    await import('jspdf-autotable');
    return jsPDF;
};
```

## Current Implementation
We're using Solution 1 with a try-catch fallback for maximum compatibility.

## Package Versions
- jsPDF: ^3.0.3
- jspdf-autotable: ^5.0.2

These versions should be compatible with the named import approach.
