import { Chat } from '../components/Chat';
import { useDataSet } from '../hooks/useDataSet';

export const ChatPage = () => {
  const { dataSet } = useDataSet();

  return (
    <div
      className={
        'mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col overflow-hidden'
      }
    >
      <Chat dataset={dataSet} variant={'page'} />
    </div>
  );
};
