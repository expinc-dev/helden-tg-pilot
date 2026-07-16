interface HostBadgeProps {
  pageName?: string
}

export const HostBadge = ({ pageName }: HostBadgeProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="my-3 w-fit rounded-full bg-[linear-gradient(252deg,#565656_-38.22%,#000_41.21%)] px-5 py-2">
        <span className="manrope-font text-helden-yellow font-semibold">Host - </span>
        {pageName && <span className="manrope-font font-normal text-white">{pageName}</span>}
      </div>
    </div>
  )
}
