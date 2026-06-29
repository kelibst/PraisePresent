import { useActiveService } from '@/renderer/features/planning/useActiveService';
import SearchPane from './SearchPane';
import PreviewSchedulePane from './PreviewSchedulePane';
import LiveOutputPane from './LiveOutputPane';
import { useScripturePresenter } from './useScripturePresenter';

// Scripture workspace (CLAUDE.md §5.4): a full-height 3-pane row inside the app
// shell's scrollable main. Pane 1 search/results (reference / card-picker /
// keyword) → stages a passage; Pane 2 previews the staged verse + the active
// service schedule; Pane 3 mirrors the live output. One scripture UI — the old
// Browse/Search tabs are folded into Pane 1's modes (§1.9). All data flows
// through window.api via the presenter hook + useActiveService (§1.3); scripture
// text is read-only everywhere (§ design).

export default function ScripturePage() {
  const presenter = useScripturePresenter();
  const { plan, loading: planLoading } = useActiveService();

  return (
    <div className="grid h-full min-h-0 grid-cols-[1.3fr_1fr_1.15fr] gap-3 bg-background p-3">
      <SearchPane
        staged={presenter.staged}
        onStage={presenter.stage}
        onStageIndex={presenter.setStagedIndex}
        onSendLive={presenter.sendLive}
      />

      <PreviewSchedulePane
        staged={presenter.staged}
        plan={plan}
        planLoading={planLoading}
        onSendLive={presenter.sendLive}
        onSetNext={presenter.setAsNext}
      />

      <LiveOutputPane
        live={presenter.live}
        onNext={presenter.next}
        onBlack={presenter.black}
        onClear={presenter.clear}
      />
    </div>
  );
}
