import type { Theme, Components } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import { tableRowClasses } from '@mui/material/TableRow';
import { tableCellClasses } from '@mui/material/TableCell';

// ----------------------------------------------------------------------

const MuiTableContainer: Components<Theme>['MuiTableContainer'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.mixins.scrollbarStyles(theme),
      position: 'relative',
    }),
  },
};

const MuiTableRow: Components<Theme>['MuiTableRow'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${tableRowClasses.selected}`]: {
        backgroundColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.04),
        '&:hover': {
          backgroundColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.08),
        },
      },
      '&:last-of-type': {
        [`& .${tableCellClasses.root}`]: {
          border: 0,
        },
      },
    }),
  },
};

const MuiTableCell: Components<Theme>['MuiTableCell'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: {
      borderBottomStyle: 'dashed',
    },
    head: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      color: theme.vars.palette.text.secondary,
      fontWeight: theme.typography.fontWeightSemiBold,
      // Mais escuro que o `background.neutral` (#F4F6F8): com o contraste alto, esse é o fundo
      // da página, e o cabeçalho sumiria na borda do card.
      backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.2),
    }),
    stickyHeader: ({ theme }) => ({
      backgroundColor: theme.vars.palette.background.paper,
      backgroundImage: `linear-gradient(to bottom, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)})`,
    }),
    paddingCheckbox: ({ theme }) => ({
      paddingLeft: theme.spacing(1),
    }),
  },
};

const MuiTablePagination: Components<Theme>['MuiTablePagination'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    slotProps: {
      select: { name: 'table-pagination-select' },
      actions: {
        previousButton: { size: 'small' },
        nextButton: { size: 'small' },
      },
    },
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: { width: '100%' },
    toolbar: { height: 64 },
    actions: { marginRight: 8 },
    select: {
      display: 'flex',
      alignItems: 'center',
    },
    selectIcon: {
      right: 4,
      width: 16,
      height: 16,
      top: 'calc(50% - 8px)',
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const table: Components<Theme> = {
  MuiTableRow,
  MuiTableCell,
  MuiTableContainer,
  MuiTablePagination,
};
