# プロジェクト全体品質レビュー修正

## 背景・原因

Phase A〜C 実装完了後の品質レビューで発見されたバグ・i18n 文言問題・堅牢性の改善を一括修正。

## 変更内容

### バグ修正
- `src/components/pdf-merger.tsx`: warning が error バナーで表示される問題を修正。`SET_WARNING` アクションを追加し warning バナーを分離
- `src/types/pdf.ts`: `PdfMergerState` に `warningKey` フィールド追加
- `src/hooks/usePdfStore.ts`: `SET_WARNING` アクション追加、`RESET_MERGE` で warningKey クリア
- `src/workers/merge.worker.ts`: `totalPages === 0` の場合に NaN progress を送信する問題を修正（エラーメッセージを返す）
- `src/hooks/usePdfThumbnail.ts`: `bufferRef` が file 変更時にクリアされない問題を修正（useEffect 追加）
- `src/validate/filename.ts`: スペースのみのファイル名が通る問題を修正（`trim()` チェック）
- `src/validate/__tests__/filename.test.ts`: スペースのみファイル名のテスト追加

### i18n 文言修正
- `src/i18n/locales/ja.json`, `src/i18n/locales/en.json`: 未使用 `PdfMerger` セクション削除、`aria` セクション追加
- `src/components/file-list.tsx`: `"Drag to reorder"` を i18n 化
- `src/components/page-list.tsx`: `"Preview"`, `"Exclude"/"Include"`, `"Rotate left"`, `"Rotate right"` を i18n 化
- `src/components/page-preview-dialog.tsx`: `"Rotate left"`, `"Rotate right"`, `"Close preview"` を i18n 化
- `src/components/pdf-merger.tsx`: aria-label の viewMode 参照不整合修正、placeholder ハードコード除去

### 堅牢性改善
- `src/components/merge-progress.tsx`: progress bar に `role="progressbar"` と `aria-valuenow/min/max` 追加
- `src/components/page-preview-dialog.tsx`: `arrayBuffer()` に `.catch()` 追加
- `.github/workflows/ci.yml`: lint ステップ追加
- `package.json`: `eslint-config-next` を v16 に更新、lint スクリプトを `eslint src/` に変更
- `eslint.config.mjs`: eslint-config-next v16 のフラット config 形式に移行

### ESLint v16 対応
- `src/theme/theme-provider.tsx`: `react-hooks/set-state-in-effect` 警告対応
- `src/components/page-preview-dialog.tsx`: `react-hooks/refs` エラー対応（setState をコールバック内に移動）
- `eslint.config.mjs`: `no-img-element` ルール無効化（data URL レンダリングのため）

## 影響範囲

- PDF 結合 UI 全体（warning 表示、aria-label、progress bar）
- ファイル名バリデーション
- Worker のエラーハンドリング
- サムネイルのメモリ管理
- CI パイプライン
