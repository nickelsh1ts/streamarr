import ProgressBar from '@app/components/Common/ProgressBar';
import SortableColumnHeader from '@app/components/Common/SortableColumnHeader';
import { formatBytes } from '@app/utils/numberHelper';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type { TorrentFile } from '@server/interfaces/api/downloadsInterfaces';
import React, { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

interface TorrentFileListProps {
  files: TorrentFile[];
  clientType: 'qbittorrent' | 'deluge' | 'transmission';
  onSetPriority: (fileIds: number[], priority: number) => Promise<void>;
}

// Sentinel used by folder / bulk selects to represent a mixed set of priorities.
const MIXED = -1;

interface FileNode {
  type: 'file';
  file: TorrentFile;
}

interface FolderNode {
  type: 'folder';
  name: string;
  path: string;
  depth: number;
  children: TreeNode[];
  fileIndices: number[];
  size: number;
}

type TreeNode = FileNode | FolderNode;

type SortField = 'name' | 'size' | 'progress' | 'priority';

interface FlatRow {
  depth: number;
  node: TreeNode;
}

const buildTree = (files: TorrentFile[]): TreeNode[] => {
  const root: TreeNode[] = [];
  // Lookup of folder path -> FolderNode so we can attach children as we go.
  const folderMap = new Map<string, FolderNode>();

  for (const file of files) {
    const segments = file.name.split('/').filter(Boolean);
    // Files that live at the torrent root have no folder segments.
    const fileName = segments.pop() ?? file.name;

    let currentLevel = root;
    let currentPath = '';
    let depth = 0;

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      let folder = folderMap.get(currentPath);
      if (!folder) {
        folder = {
          type: 'folder',
          name: segment,
          path: currentPath,
          depth,
          children: [],
          fileIndices: [],
          size: 0,
        };
        folderMap.set(currentPath, folder);
        currentLevel.push(folder);
      }
      folder.fileIndices.push(file.index);
      folder.size += file.size;
      currentLevel = folder.children;
      depth += 1;
    }

    currentLevel.push({
      type: 'file',
      file: { ...file, name: fileName },
    });
  }

  return root;
};

/**
 * Smart default: if the torrent is a single top-level folder (the common
 * season-pack / release-folder case), expand that folder and any single-child
 * folder chain beneath it. Otherwise start fully collapsed.
 */
const computeDefaultExpanded = (tree: TreeNode[]): Set<string> => {
  const expanded = new Set<string>();
  if (tree.length === 1 && tree[0].type === 'folder') {
    let node: FolderNode | null = tree[0];
    while (node) {
      expanded.add(node.path);
      const childFolders = node.children.filter(
        (c): c is FolderNode => c.type === 'folder'
      );
      // Keep walking only while the chain stays single (avoid auto-opening
      // a folder that branches into many sub-folders).
      node = childFolders.length === 1 ? childFolders[0] : null;
    }
  }
  return expanded;
};

const TorrentFileList: React.FC<TorrentFileListProps> = ({
  files,
  clientType,
  onSetPriority,
}) => {
  const intl = useIntl();
  const [updatingFiles, setUpdatingFiles] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    computeDefaultExpanded(buildTree(files))
  );
  const [currentSort, setCurrentSort] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const tree = useMemo(() => buildTree(files), [files]);

  const filesByIndex = useMemo(
    () => new Map(files.map((f) => [f.index, f])),
    [files]
  );

  const getPriorityLabel = (priority: number): string => {
    if (priority === MIXED) return 'Mixed';
    if (clientType === 'deluge') {
      // Deluge uses: 0=skip, 1=low, 2=normal, 5=high
      switch (priority) {
        case 0:
          return 'Skip';
        case 1:
          return 'Low';
        case 2:
          return 'Normal';
        case 5:
          return 'High';
        default:
          return 'Mixed';
      }
    } else if (clientType === 'transmission') {
      // Transmission uses: 0=skip, 1=low, 2=normal, 6=high
      switch (priority) {
        case 0:
          return 'Skip';
        case 1:
          return 'Low';
        case 2:
          return 'Normal';
        case 6:
          return 'High';
        default:
          return 'Mixed';
      }
    } else {
      // qBittorrent uses: 0=skip, 1=normal, 6=high, 7=maximum
      switch (priority) {
        case 0:
          return 'Do not download';
        case 1:
          return 'Normal';
        case 6:
          return 'High';
        case 7:
          return 'Maximum';
        default:
          return 'Mixed';
      }
    }
  };

  // Selectable priority values for the active client.
  const priorityOptions = useMemo<number[]>(() => {
    if (clientType === 'deluge') return [0, 1, 2, 5];
    if (clientType === 'transmission') return [0, 1, 2, 6];
    return [0, 1, 6, 7];
  }, [clientType]);

  const applyPriority = async (fileIds: number[], priority: number) => {
    if (fileIds.length === 0) return;
    setUpdatingFiles((prev) => {
      const next = new Set(prev);
      fileIds.forEach((id) => next.add(id));
      return next;
    });
    try {
      await onSetPriority(fileIds, priority);
    } finally {
      setUpdatingFiles((prev) => {
        const next = new Set(prev);
        fileIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const toggleFolder = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleSelection = (fileIds: number[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      fileIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const allFileIndices = useMemo(() => files.map((f) => f.index), [files]);
  const allSelected =
    allFileIndices.length > 0 && allFileIndices.every((id) => selected.has(id));
  const someSelected = allFileIndices.some((id) => selected.has(id));

  // Common priority across a set of file indices, or MIXED when they differ.
  const commonPriority = useCallback(
    (fileIndices: number[]): number => {
      if (fileIndices.length === 0) return MIXED;
      const first = filesByIndex.get(fileIndices[0])?.priority;
      return fileIndices.every((id) => filesByIndex.get(id)?.priority === first)
        ? (first ?? MIXED)
        : MIXED;
    },
    [filesByIndex]
  );

  // Weighted (by size) aggregate progress for a set of file indices, 0-1.
  const folderProgress = useCallback(
    (fileIndices: number[]): number => {
      let done = 0;
      let total = 0;
      for (const id of fileIndices) {
        const f = filesByIndex.get(id);
        if (!f) continue;
        done += f.progress * f.size;
        total += f.size;
      }
      return total > 0 ? done / total : 0;
    },
    [filesByIndex]
  );

  const handleSort = (field: SortField) => {
    if (currentSort === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCurrentSort(field);
      setSortDirection('asc');
    }
  };

  const sortedTree = useMemo<TreeNode[]>(() => {
    const mult = sortDirection === 'asc' ? 1 : -1;

    const nameOf = (node: TreeNode) =>
      node.type === 'folder' ? node.name : node.file.name;
    const sizeOf = (node: TreeNode) =>
      node.type === 'folder' ? node.size : node.file.size;
    const progressOf = (node: TreeNode) =>
      node.type === 'folder'
        ? folderProgress(node.fileIndices)
        : node.file.progress;
    const priorityOf = (node: TreeNode) =>
      node.type === 'folder'
        ? commonPriority(node.fileIndices)
        : node.file.priority;

    const compare = (a: TreeNode, b: TreeNode): number => {
      let primary = 0;
      switch (currentSort) {
        case 'name':
          primary = nameOf(a).localeCompare(nameOf(b));
          break;
        case 'size':
          primary = sizeOf(a) - sizeOf(b);
          break;
        case 'progress':
          primary = progressOf(a) - progressOf(b);
          break;
        case 'priority':
          primary = priorityOf(a) - priorityOf(b);
          break;
      }
      if (primary !== 0) return primary * mult;
      // Stable, deterministic tiebreak — always A→Z regardless of direction.
      return nameOf(a).localeCompare(nameOf(b));
    };

    const sortRec = (nodes: TreeNode[]): TreeNode[] =>
      [...nodes]
        .sort(compare)
        .map((node) =>
          node.type === 'folder'
            ? { ...node, children: sortRec(node.children) }
            : node
        );

    return sortRec(tree);
  }, [tree, currentSort, sortDirection, commonPriority, folderProgress]);

  // Flatten the tree into visible rows, honouring collapsed folders.
  const visibleRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    const walk = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        rows.push({ depth, node });
        if (node.type === 'folder' && expanded.has(node.path)) {
          walk(node.children, depth + 1);
        }
      }
    };
    walk(sortedTree, 0);
    return rows;
  }, [sortedTree, expanded]);

  const renderPriorityOptions = (
    includeMixed: boolean,
    currentValue?: number
  ) => {
    const showFallback =
      currentValue !== undefined &&
      currentValue !== MIXED &&
      !priorityOptions.includes(currentValue);
    return (
      <>
        {includeMixed && (
          <option value={MIXED} disabled hidden>
            {getPriorityLabel(MIXED)}
          </option>
        )}
        {showFallback && (
          <option value={currentValue} disabled hidden>
            {getPriorityLabel(currentValue)}
          </option>
        )}
        {priorityOptions.map((value) => (
          <option key={value} value={value}>
            {getPriorityLabel(value)}
          </option>
        ))}
      </>
    );
  };

  if (files.length === 0) {
    return (
      <div className="text-neutral py-4 text-center">
        <FormattedMessage
          id="downloads.noFilesFound"
          defaultMessage="No files found"
        />
      </div>
    );
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="bg-base-300 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2">
          <span className="text-sm font-semibold whitespace-nowrap">
            {selected.size}{' '}
            <FormattedMessage
              id="downloads.selected"
              defaultMessage="selected"
            />
          </span>
          <div className="flex items-center gap-2">
            <select
              className="select select-xs select-primary min-w-36"
              value={commonPriority([...selected])}
              onChange={(e) =>
                applyPriority([...selected], parseInt(e.target.value, 10))
              }
              aria-label={intl.formatMessage({
                id: 'downloads.setPriorityForSelected',
                defaultMessage: 'Set priority for selected files',
              })}
            >
              {renderPriorityOptions(true, commonPriority([...selected]))}
            </select>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setSelected(new Set())}
            >
              <FormattedMessage
                id="downloads.clearSelection"
                defaultMessage="Clear"
              />
            </button>
          </div>
        </div>
      )}
      <div className="max-h-96 overflow-auto">
        <table className="table-xs table">
          <thead className="bg-base-100 sticky top-0 z-10">
            <tr>
              <th className="w-8">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allSelected && someSelected;
                  }}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? new Set(allFileIndices) : new Set()
                    )
                  }
                  aria-label={intl.formatMessage({
                    id: 'downloads.selectAllFiles',
                    defaultMessage: 'Select all files',
                  })}
                />
              </th>
              <SortableColumnHeader<SortField>
                field="name"
                activeField={currentSort}
                direction={sortDirection}
                onSort={handleSort}
                className="max-w-xs min-w-50"
              >
                <FormattedMessage id="common.name" defaultMessage="Name" />
              </SortableColumnHeader>
              <SortableColumnHeader<SortField>
                field="size"
                activeField={currentSort}
                direction={sortDirection}
                onSort={handleSort}
                className="min-w-20"
              >
                <FormattedMessage id="common.size" defaultMessage="Size" />
              </SortableColumnHeader>
              <SortableColumnHeader<SortField>
                field="progress"
                activeField={currentSort}
                direction={sortDirection}
                onSort={handleSort}
                className="min-w-30"
              >
                <FormattedMessage
                  id="common.progress"
                  defaultMessage="Progress"
                />
              </SortableColumnHeader>
              <SortableColumnHeader<SortField>
                field="priority"
                activeField={currentSort}
                direction={sortDirection}
                onSort={handleSort}
                className="min-w-35"
              >
                <FormattedMessage
                  id="common.priority"
                  defaultMessage="Priority"
                />
              </SortableColumnHeader>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ depth, node }) => {
              const indent = { paddingLeft: `${depth * 1.25 + 0.25}rem` };

              if (node.type === 'folder') {
                const isExpanded = expanded.has(node.path);
                const folderSelected =
                  node.fileIndices.length > 0 &&
                  node.fileIndices.every((id) => selected.has(id));
                const folderSome = node.fileIndices.some((id) =>
                  selected.has(id)
                );
                const folderPriority = commonPriority(node.fileIndices);
                const folderUpdating = node.fileIndices.some((id) =>
                  updatingFiles.has(id)
                );

                return (
                  <tr
                    key={`folder:${node.path}`}
                    className="hover hover:bg-base-300 font-medium"
                  >
                    <td className="w-8">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={folderSelected}
                        ref={(el) => {
                          if (el)
                            el.indeterminate = !folderSelected && folderSome;
                        }}
                        onChange={(e) =>
                          toggleSelection(node.fileIndices, e.target.checked)
                        }
                        aria-label={intl.formatMessage(
                          {
                            id: 'downloads.selectFolder',
                            defaultMessage: 'Select folder {name}',
                          },
                          { name: node.name }
                        )}
                      />
                    </td>
                    <td className="max-w-xs min-w-50">
                      <div className="flex items-center" style={indent}>
                        <button
                          type="button"
                          onClick={() => toggleFolder(node.path)}
                          className="hover:text-primary mr-1 flex w-full items-center gap-1 hover:cursor-pointer"
                          aria-expanded={isExpanded}
                          aria-label={intl.formatMessage(
                            {
                              id: 'downloads.toggleFolder',
                              defaultMessage: 'Toggle folder {name}',
                            },
                            { name: node.name }
                          )}
                        >
                          <span>
                            <ChevronDownIcon
                              className={`size-4 transition-transform ${
                                isExpanded ? 'rotate-0' : '-rotate-90'
                              }`}
                            />
                          </span>
                          <span
                            className="block cursor-pointer truncate text-xs"
                            title={node.name}
                          >
                            {node.name}
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="min-w-20 text-xs whitespace-nowrap">
                      {formatBytes(node.size)}
                    </td>
                    <td className="min-w-30">
                      <ProgressBar
                        progress={folderProgress(node.fileIndices) * 100}
                      />
                    </td>
                    <td className="min-w-35">
                      <div className="flex items-center gap-1">
                        <select
                          className="select select-xs select-primary min-w-30"
                          value={folderPriority}
                          onChange={(e) =>
                            applyPriority(
                              node.fileIndices,
                              parseInt(e.target.value, 10)
                            )
                          }
                          disabled={folderUpdating}
                        >
                          {renderPriorityOptions(
                            folderPriority === MIXED,
                            folderPriority
                          )}
                        </select>
                        {folderUpdating && (
                          <span className="loading loading-spinner loading-xs"></span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }

              const file = node.file;
              const fileUpdating = updatingFiles.has(file.index);

              return (
                <tr
                  key={`file:${file.index}`}
                  className="hover hover:bg-base-300"
                >
                  <td className="w-8">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={selected.has(file.index)}
                      onChange={(e) =>
                        toggleSelection([file.index], e.target.checked)
                      }
                      aria-label={intl.formatMessage(
                        {
                          id: 'downloads.selectFile',
                          defaultMessage: 'Select file {name}',
                        },
                        { name: file.name }
                      )}
                    />
                  </td>
                  <td className="max-w-xs min-w-50">
                    <span
                      className="block truncate text-xs"
                      style={indent}
                      title={file.name}
                    >
                      {file.name}
                    </span>
                  </td>
                  <td className="min-w-20 text-xs whitespace-nowrap">
                    {formatBytes(file.size)}
                  </td>
                  <td className="min-w-30">
                    <ProgressBar progress={file.progress * 100} />
                  </td>
                  <td className="min-w-35">
                    <div className="flex items-center gap-1">
                      <select
                        className="select select-xs select-primary min-w-30"
                        value={file.priority}
                        onChange={(e) =>
                          applyPriority(
                            [file.index],
                            parseInt(e.target.value, 10)
                          )
                        }
                        disabled={fileUpdating}
                      >
                        {renderPriorityOptions(false, file.priority)}
                      </select>
                      {fileUpdating && (
                        <span className="loading loading-spinner loading-xs"></span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TorrentFileList;
