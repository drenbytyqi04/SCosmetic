import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { Navbar } from '@/components/layout/navbar';
import { getCategories } from '@/lib/products/queries';

/**
 * Server wrapper for the header: fetches the live category list once and hands it to
 * the interactive navbar, so the client never has to fetch its own navigation.
 */
export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <>
      <AnnouncementBar />
      <Navbar categories={categories} />
    </>
  );
}
