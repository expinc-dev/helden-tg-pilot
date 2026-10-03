interface HostBadgeProps {
  pageName?: string
}

export const HostBadge = ({ pageName }: HostBadgeProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-fit rounded-full bg-[linear-gradient(207deg,#565656_38.22%,#000_41.21%)] px-4 py-2 text-base leading-[1.2]">
        <span className="text-[#fdc300]">{pageName ? 'Host - ' : 'Host'}</span>
        {pageName && <span className="text-white">{pageName}</span>}
      </div>
    </div>
  )
}
