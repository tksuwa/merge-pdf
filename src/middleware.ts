import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // サポートする言語のリスト
  locales: ['ja', 'en'],

  // デフォルトの言語
  defaultLocale: 'ja'
});

export const config = {
  // すべてのパスでミドルウェアを実行
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 