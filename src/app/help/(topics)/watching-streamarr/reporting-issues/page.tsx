import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const ReportingIssues = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/reporting-issues"
        homeElement={'Help Centre'}
        names="Watching Streamarr,How can I report an issue with Streamarr content?"
      />
      <div>ReportingIssues</div>
    </section>
  );
};

export default ReportingIssues;
