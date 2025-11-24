// src/components/PedigreeTree.tsx – ULTIMATE: PDF + TOOLTIPS + RESPONSIVE
import { useDogStore } from '@/store/dogStoreFirebase';
import Tree from 'react-d3-tree';
import { Dog } from '@/types/dog';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TreeNode {
  name: string;
  attributes?: { sex: string; dob: string; color?: string; titles?: string };
  children?: TreeNode[];
}

const buildTree = (
  dog: Dog | undefined,
  allDogs: Dog[],
  depth = 0
): TreeNode => {
  if (!dog || depth > 5) return { name: depth > 5 ? '...' : 'Unknown' };

  const sire = allDogs.find((d) => d.id === dog.sireId);
  const dam = allDogs.find((d) => d.id === dog.damId);

  return {
    name: dog.name || 'Unknown',
    attributes: {
      sex: dog.sex === 'female' ? '♀ Female' : '♂ Male',
      dob: dog.dateOfBirth || 'Unknown DOB',
      color: dog.color || '',
      titles: dog.notes?.slice(0, 50) || '',
    },
    children: [
      buildTree(sire, allDogs, depth + 1),
      buildTree(dam, allDogs, depth + 1),
    ],
  };
};

export function PedigreeTree({ dogId }: { dogId: string }) {
  const { dogs } = useDogStore();
  const rootDog = dogs.find((d) => d.id === dogId);
  const treeRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (treeRef.current) {
        setDimensions({
          width: treeRef.current.offsetWidth,
          height: treeRef.current.offsetHeight || 600,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!rootDog) return <div className='text-center py-10'>Dog not found</div>;

  const treeData = [buildTree(rootDog, dogs)];

  const exportPDF = async () => {
    if (!treeRef.current) return;

    const canvas = await html2canvas(treeRef.current, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
    pdf.setFontSize(22);
    pdf.text(`${rootDog.name} - 5 Generation Pedigree`, pdfWidth / 2, 15, {
      align: 'center',
    });
    pdf.setFontSize(12);
    pdf.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      pdfWidth / 2,
      pdfHeight - 10,
      { align: 'center' }
    );

    pdf.save(`${rootDog.name.replace(/ /g, '_')}_pedigree.pdf`);
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-semibold'>5-Generation Pedigree</h3>
        <Button onClick={exportPDF} size='sm'>
          <Download className='mr-2 h-4 w-4' /> Export PDF
        </Button>
      </div>

      <div
        ref={treeRef}
        className='w-full h-96 md:h-[700px] lg:h-[800px] bg-card rounded-xl border shadow-lg overflow-hidden'
      >
        <Tree
          data={treeData}
          orientation='vertical'
          translate={{ x: dimensions.width / 2, y: 80 }}
          zoomable
          collapsible={false}
          pathFunc='step'
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          nodeSize={{ x: 280, y: 180 }}
          renderCustomNodeElement={(rd3tProps: any) => (
            <g className='cursor-pointer group'>
              <rect
                width='260'
                height='140'
                x='-130'
                y='-70'
                rx='20'
                fill={
                  rd3tProps.nodeDatum.attributes?.sex.includes('♀')
                    ? '#fdf2f8'
                    : '#eff6ff'
                }
                stroke={
                  rd3tProps.nodeDatum.attributes?.sex.includes('♀')
                    ? '#ec4899'
                    : '#3b82f6'
                }
                strokeWidth='3'
              />
              <text
                x='0'
                y='-30'
                textAnchor='middle'
                className='fill-foreground font-bold text-xl'
              >
                {rd3tProps.nodeDatum.name}
              </text>
              <text
                x='0'
                y='-5'
                textAnchor='middle'
                className='fill-primary text-lg'
              >
                {rd3tProps.nodeDatum.attributes?.sex}
              </text>
              <text
                x='0'
                y='15'
                textAnchor='middle'
                className='fill-muted-foreground text-sm'
              >
                {rd3tProps.nodeDatum.attributes?.dob}
              </text>
              <text
                x='0'
                y='35'
                textAnchor='middle'
                className='fill-muted-foreground text-xs'
              >
                {rd3tProps.nodeDatum.attributes?.color}
              </text>

              {/* Tooltip */}
              <foreignObject x='-130' y='-80' width='260' height='160'>
                <div className='opacity-0 group-hover:opacity-100 transition pointer-events-none'>
                  <div className='bg-black/90 text-white text-xs rounded-lg p-3 shadow-2xl -mt-2'>
                    <div className='font-bold'>{rd3tProps.nodeDatum.name}</div>
                    <div>{rd3tProps.nodeDatum.attributes?.sex}</div>
                    <div>DOB: {rd3tProps.nodeDatum.attributes?.dob}</div>
                    {rd3tProps.nodeDatum.attributes?.color && (
                      <div>Color: {rd3tProps.nodeDatum.attributes?.color}</div>
                    )}
                    {rd3tProps.nodeDatum.attributes?.titles && (
                      <div className='mt-1 text-xs opacity-80'>
                        {rd3tProps.nodeDatum.attributes?.titles}
                      </div>
                    )}
                  </div>
                </div>
              </foreignObject>
            </g>
          )}
        />
      </div>
    </div>
  );
}
