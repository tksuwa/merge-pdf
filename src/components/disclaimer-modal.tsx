interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-right text-sm text-gray-500 mb-4">
          最終更新：2025-05-13
        </div>
        <div className="space-y-6 text-left">
          <section>
            <h2 className="text-xl font-bold mb-3">本アプリについて</h2>
            <p className="mb-2">
              ブラウザだけで動く無料の PDF 結合ツールです。
            </p>
            <p>
              サーバー通信は行わず、処理はすべてユーザー端末内で完結します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">ファイルとプライバシー</h2>
            <p className="mb-2">
              取り込んだ PDF
              は端末のメモリやブラウザの一時領域にのみ保存され、外部へ送信されることはありません。
            </p>
            <p>
              作業終了後にキャッシュを削除するかシークレットモードでご利用いただくと、痕跡を最小限にできます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">免責事項</h2>
            <p className="mb-2">
              本アプリの動作や結合結果の正確性・安全性について、いかなる保証も行いません。
            </p>
            <p>
              ご利用は自己責任でお願いします。重要なファイルは必ずバックアップを取ってからお試しください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">損害賠償について</h2>
            <p>
              本アプリの利用または利用不能に起因して発生した損失・損害（データ損失、逸失利益などを含む）について、作者は一切の賠償責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">アップデート・提供終了</h2>
            <p>
              予告なく機能を追加・変更・停止することがあります。最新情報は
              GitHub リポジトリまたは公開ページをご確認ください。
            </p>
          </section>
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
