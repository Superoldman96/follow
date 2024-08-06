import { useGeneralSettingKey } from "@renderer/atoms/settings/general"
import { m } from "@renderer/components/common/Motion"
import { EmptyIcon } from "@renderer/components/icons/empty"
import { ReactVirtuosoItemPlaceholder } from "@renderer/components/ui/placeholder"
import { useRouteParamsSelector } from "@renderer/hooks/biz/useRouteParams"
import { useEntry } from "@renderer/store/entry"
import type { HTMLMotionProps } from "framer-motion"
import type { DOMAttributes, FC } from "react"
import { forwardRef, memo, useCallback } from "react"
import type {
  VirtuosoHandle,
  VirtuosoProps,
} from "react-virtuoso"
import { GroupedVirtuoso, Virtuoso } from "react-virtuoso"

import { DateItem } from "./date-item"
import { EntryColumnShortcutHandler } from "./EntryColumnShortcutHandler"

export const EntryListContent = forwardRef<HTMLDivElement>((props, ref) => (
  <div className="px-2" {...props} ref={ref} />
))

export const EntryEmptyList = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>((props, ref) => {
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  return (
    <m.div
      className="absolute -mt-6 flex size-full grow flex-col items-center justify-center gap-2 text-zinc-400"
      {...props}
      ref={ref}
    >
      {unreadOnly ? (
        <>
          <i className="i-mgc-celebrate-cute-re -mt-11 text-3xl" />
          <span className="text-base">Zero Unread</span>
        </>
      ) : (
        <div className="flex -translate-y-6 flex-col items-center justify-center gap-2">
          <EmptyIcon className="size-[30px]" />
          <span className="text-base">Zero Items</span>
        </div>
      )}
    </m.div>
  )
})

type BaseEntryProps = {
  virtuosoRef: React.RefObject<VirtuosoHandle>
  refetch: () => void
}
type EntryListProps = VirtuosoProps<string, unknown> & {
  groupCounts?: number[]
} & BaseEntryProps
export const EntryList: FC<EntryListProps> = memo(
  ({
    virtuosoRef,
    refetch,
    groupCounts,

    ...virtuosoOptions
  }) => {
    // Prevent scroll list move when press up/down key, the up/down key should be taken over by the shortcut key we defined.
    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> =
      useCallback((e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault()
        }
      }, [])

    return (
      <>
        {groupCounts ? (
          <EntryGroupedList
            groupCounts={groupCounts}
            onKeyDown={handleKeyDown}
            {...virtuosoOptions}
            ref={virtuosoRef}
          />
        ) : (
          <Virtuoso
            onKeyDown={handleKeyDown}
            {...virtuosoOptions}
            ref={virtuosoRef}
          />
        )}
        <EntryColumnShortcutHandler
          refetch={refetch}
          data={virtuosoOptions.data!}
          virtuosoRef={virtuosoRef}
        />
      </>
    )
  },
)

const EntryGroupedList = forwardRef<
  VirtuosoHandle,
  VirtuosoProps<string, unknown> &
  DOMAttributes<HTMLDivElement> & {
    groupCounts: number[]
  }
>(
  (
    {
      groupCounts,
      itemContent,
      onKeyDown,

      ...virtuosoOptions
    },
    ref,
  ) => (
    <GroupedVirtuoso
      ref={ref}
      groupContent={useCallback(
        (index: number) => {
          const entryId = getGetGroupDataIndex(
            groupCounts!,
            index,
            virtuosoOptions.data!,
          )

          return <EntryHeadDateItem entryId={entryId} />
        },
        [groupCounts, virtuosoOptions.data],
      )}
      groupCounts={groupCounts}
      onKeyDown={onKeyDown}
      {...virtuosoOptions}
      itemContent={useCallback(
        (index: number, _: number, entryId: string, c: any) =>
          itemContent?.(index, entryId, c),
        [itemContent],
      )}
    />
  ),
)

function getGetGroupDataIndex<T>(
  groupCounts: number[],
  groupIndex: number,
  data: readonly T[],
) {
  // Get first grouped of data index
  //
  let sum = 0
  for (let i = 0; i < groupIndex; i++) {
    sum += groupCounts[i]
  }
  return data[sum]
}

const EntryHeadDateItem: FC<{
  entryId: string
}> = ({ entryId }) => {
  const entry = useEntry(entryId)

  const view = useRouteParamsSelector((s) => s.view)

  if (!entry) return <ReactVirtuosoItemPlaceholder />
  const date = new Date(entry.entries.publishedAt).toDateString()
  return <DateItem date={date} view={view} isFirst={true} />
}
