interface HostBadgeProps {
  pageName?: string
}

export const HostBadge = ({ pageName }: HostBadgeProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-helden-pill-gradient w-fit rounded-full px-4 py-2 text-base leading-[1.2]">
        <span className="text-[#fdc300]">{pageName ? 'Host - ' : 'Host'}</span>
        {pageName && <span className="text-white">{pageName}</span>}
      </div>
    </div>
  )
}
