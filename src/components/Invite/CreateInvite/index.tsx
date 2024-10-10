'use client';
import { useState } from 'react';

const CreateInvite = ({ setModalState }) => {
  const [select, setOption] = useState('day');
  return (
    <div className="max-w-lg mx-auto">
      <form action="#" method="POST" className="space-y-2">
        <div className="border-t border-primary pt-4">
          <label
            htmlFor="icode"
            className="block text-sm font-medium leading-6 text-left"
          >
            Invite Code
          </label>
          <div className="">
            <input
              id="icode"
              name="icode"
              type="text"
              required
              placeholder="STRMRR"
              autoComplete="email"
              className="input input-primary input-bordered w-full py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="expiration"
              className="block text-sm font-medium leading-6"
            >
              Invite Expiration
            </label>
          </div>
          <div className="flex gap-2">
            {select != 'never' && (
              <input
                className={`input input-primary input-bordered max-w-14`}
                type="number"
                max={'31'}
                defaultValue={'2'}
                min={'0'}
              />
            )}
            <select
              required
              onChange={(e) => setOption(e.target.value)}
              value={select}
              className="select select-md select-primary w-full py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <option value={'day'}>Day(s)</option>
              <option value={'week'}>Week(s)</option>
              <option value={'month'}>Month(s)</option>
              <option value={'year'}>year(s)</option>
              <option value={'never'}>Never</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="unlimited"
            name="unlimited"
            type="checkbox"
            className="checkbox checkbox-xs rounded-md checkbox-primary"
          />
          <label htmlFor="unlimited" className="">
            Unlimited invite usage
          </label>
        </div>
        <div className="flex items-center gap-2 border-b border-primary pb-4">
          <input
            id="downloads"
            name="downloads"
            type="checkbox"
            className="checkbox checkbox-xs rounded-md checkbox-primary"
            defaultChecked
          />
          <label htmlFor="downloads" className="">
            Allow Plex Downloads
          </label>
        </div>
        <div className="flex w-full place-content-end gap-2">
          <button className="btn btn-sm btn-primary mt-2">Create Invite</button>
          <button onClick={() => setModalState(false)} type="reset" className="btn btn-sm btn-neutral mt-2">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreateInvite;
