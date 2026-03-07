# PDF結合・編集アプリ

Next.js + shadcn/ui + Tailwind CSS で作成した、ブラウザ内完結の PDF 結合・編集アプリです。

## 主な機能

- PDF ファイルの読み込み（ドラッグ&ドロップ / クリック選択）
- 1ファイル時は `保存`、2ファイル以上は `PDFを結合`
- ファイル単位の並び替え（`リスト`）
- ページ単位の並び替え・回転（`詳細`）
- ページプレビュー（拡大・縮小・回転）
- 暗号化/破損PDFの検出、サイズ・ページ数のバリデーション
- ダークモード / i18n（日本語・英語）

## 使い方

1. PDF を 1つ以上追加する
2. `リスト` でファイル順を調整する
3. 必要に応じて `詳細` でページ順・回転を調整する
4. 1ファイルなら `保存`、2ファイル以上なら `PDFを結合` を押す
5. 結果セクションでファイル名を確認してダウンロードする  
   結合完了時は結果セクションへ自動スクロールします

### テスト

```bash
npm run test:run
```

## 技術スタック

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [pdf-lib](https://pdf-lib.js.org/)
- [pdfjs-dist](https://github.com/mozilla/pdf.js/)
- [dnd-kit](https://dndkit.com/)

## ライセンス

MIT
